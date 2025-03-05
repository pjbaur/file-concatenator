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

        // Retrieve selected resources from the File Explorer
        const selectedUris = await vscode.commands.executeCommand<vscode.Uri[]>('explorer.getSelection');

        if (!selectedUris || selectedUris.length === 0) {
            vscode.window.showInformationMessage('No files selected in Explorer.');
            return;
        }

        // Prepare concatenated content
        let concatenatedContent = '';
        
        for (const fileUri of selectedUris) {
            try {
                // Check if it's a file (not a directory)
                const stat = await vscode.workspace.fs.stat(fileUri);
                if (stat.type !== vscode.FileType.File) {
                    continue;
                }

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