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

        // Get selected URIs
        let selectedUris: vscode.Uri[] = [];
        
        // Try to get selected files from the active text editor
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor) {
            selectedUris.push(activeTextEditor.document.uri);
        }

        // Try to get selected files from the context
        try {
            const contextSelection = await vscode.commands.executeCommand<vscode.Uri[]>('vscode.open');
            if (contextSelection && contextSelection.length > 0) {
                selectedUris = contextSelection;
            }
        } catch (error) {
            // Fallback to file dialog if context selection fails
            selectedUris = await vscode.window.showOpenDialog({
                canSelectMany: true,
                openLabel: 'Select Files to Concatenate'
            }) || [];
        }

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