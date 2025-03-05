import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('file-concatenator.copySelectedFiles', async () => {
        // Get the currently open workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        // Get the current active file explorer view
        const activeTextEditor = vscode.window.activeTextEditor;
        const selectedUris: vscode.Uri[] = activeTextEditor 
            ? [activeTextEditor.document.uri] 
            : await vscode.window.showOpenDialog({
                canSelectMany: true,
                openLabel: 'Select Files to Concatenate'
            }) || [];

        if (selectedUris.length === 0) {
            vscode.window.showInformationMessage('No files selected.');
            return;
        }

        // Prepare concatenated content
        let concatenatedContent = '';
        
        for (const fileUri of selectedUris) {
            try {
                // Read file contents
                const fileContents = await vscode.workspace.fs.readFile(fileUri);
                const fileText = new TextDecoder().decode(fileContents);
                
                // Get relative path from workspace root
                const relativePath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
                
                // Add file path marker and contents
                concatenatedContent += `%% ${relativePath} &&\n`;
                concatenatedContent += fileText + '\n';
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