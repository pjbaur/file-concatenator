import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    // Create a channel for extension logs
    const outputChannel = vscode.window.createOutputChannel('File Concatenator');
    
    // Create a log file in the extension's storage path
    const createLogFile = (context: vscode.ExtensionContext) => {
        const logFilePath = path.join(context.storageUri?.fsPath || '', 'debug.log');
        
        // Ensure storage directory exists
        if (!fs.existsSync(context.storageUri?.fsPath || '')) {
            fs.mkdirSync(context.storageUri?.fsPath || '', { recursive: true });
        }

        return logFilePath;
    };

    const logFilePath = createLogFile(context);

    // Logging function that writes to both output channel and file
    const log = (message: string) => {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${message}`;
        
        // Log to VS Code's Output panel
        outputChannel.appendLine(formattedMessage);
        
        // Log to file
        try {
            fs.appendFileSync(logFilePath, formattedMessage + '\n');
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    };

    let disposable = vscode.commands.registerCommand('file-concatenator.copySelectedFiles', async (uri, selectedUris) => {
        // Clear previous logs
        outputChannel.clear();
        
        log('Starting file concatenation');

        // Get the currently open workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            log('No workspace folder found');
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        // Log workspace details
        log(`Workspace Folder: ${workspaceFolder.uri.fsPath}`);
        
        // Log active text editor details
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor) {
            log(`Active Editor File: ${activeTextEditor.document.uri.fsPath}`);
            selectedUris.push(activeTextEditor.document.uri);
        } else {
            log('No active text editor');
        }

        // If multiple files are selected, selectedUris will contain all of them
        // If only one file is selected, uri will contain that single file
        const files = selectedUris || (uri ? [uri] : []);

        if (!files.length) {
            log('No files selected');
            // Do I showInformationMessage or showErrorMessage?
            vscode.window.showErrorMessage('No files selected.');
            return;
        }

        log(`Selected Files: ${files.map((file: vscode.Uri) => file.fsPath).join(', ')}`);

        // Prepare concatenated content
        let concatenatedContent = '';
        
        for (const fileUri of files) {
            try {
                // Verify it's a file
                const stat = await vscode.workspace.fs.stat(fileUri);
                if (stat.type !== vscode.FileType.File) {
                    log(`Skipping non-file: ${fileUri.fsPath}`);
                    continue;
                }

                // Read file contents
                const fileContents = await vscode.workspace.fs.readFile(fileUri);
                const fileText = new TextDecoder().decode(fileContents);
                
                // Get relative path from workspace root
                const relativePath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
                
                log(`Processing file: ${fileUri.fsPath}`);
                log(`Relative path: ${relativePath}`);

                // Add file path marker and contents
                concatenatedContent += `%% ${relativePath} &&\n`;
                concatenatedContent += fileText + '\n';
                concatenatedContent += `%% end %%\n\n`;
            } catch (error) {
                log(`Error reading file ${fileUri.fsPath}: ${error}`);
                vscode.window.showErrorMessage(`Error reading file ${fileUri.fsPath}: ${error}`);
            }
        }

        // Create a new untitled document with concatenated content
        const newDocument = await vscode.workspace.openTextDocument({
            content: concatenatedContent,
            language: 'plaintext'
        });
        
        log('Creating new document with concatenated content');

        // Show the new document
        await vscode.window.showTextDocument(newDocument);

        log('File concatenation complete');
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(outputChannel);
}

export function deactivate() {}