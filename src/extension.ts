import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('file-concatenator.copySelectedFiles', async () => {
        // Get the currently open workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        // Get selected files from File Explorer
        const selectedFiles = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: 'Select Files to Concatenate',
            canSelectFiles: true,
            canSelectFolders: false
        });

        if (!selectedFiles || selectedFiles.length === 0) {
            return;
        }

        // Prepare concatenated content
        let concatenatedContent = '';
        
        for (const fileUri of selectedFiles) {
            try {
                // Read file contents
                const fileContents = fs.readFileSync(fileUri.fsPath, 'utf8');
                
                // Get relative path from workspace root
                const relativePath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
                
                // Add file path marker and contents
                concatenatedContent += `%% ${relativePath} &&\n`;
                concatenatedContent += fileContents + '\n';
                concatenatedContent += `%% end %%\n\n`;
            } catch (error) {
                vscode.window.showErrorMessage(`Error reading file ${fileUri.fsPath}: ${error}`);
            }
        }

        // Create a new untitled document with concatenated content
        const newDocument = await vscode.workspace.openTextDocument({
            content: concatenatedContent,
            language: 'plaintext'
        });
        
        // Show the new document
        await vscode.window.showTextDocument(newDocument);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}