# File Concatenator VS Code Extension

## Features

This extension allows you to quickly concatenate selected files from the File Explorer into a new document. 

- Select multiple files from the File Explorer
- Run the "Concatenate Selected Files" command
- A new document is created with:
  - File paths as markers
  - Full contents of selected files
  - Consistent file separation markers

## Usage

1. Open a workspace in VS Code
2. Select files in the File Explorer
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
4. Type "Concatenate Selected Files"
5. Choose the files you want to concatenate

## Example Output

```
%% src/main.js &&
(contents of main.js)
%% end %%

%% tests/test.js &&
(contents of test.js)
%% end %%
```

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "File Concatenator"
4. Click Install

## Development

To develop or modify the extension:

1. Clone the repository
2. Run `npm install`
3. Press F5 to start debugging


Here's how to set this up and use the extension:

1. Create a new directory for your extension
2. Save each of these files in the appropriate location:
   - `package.json` in the root
   - `src/extension.ts` for the TypeScript source
   - `tsconfig.json` in the root
   - `README.md` in the root

3. Run `npm install` to install dependencies
4. Use `npm run compile` to compile the TypeScript
5. Press F5 or go to the Run and Debug view to run the extension

The extension does the following:
- Allows selecting multiple files from the File Explorer
- Reads the contents of each selected file
- Generates a new document with file paths as markers
- Separates each file's contents with start and end markers
- Handles errors gracefully (e.g., if a file can't be read)

To use the extension:
1. Select files in the File Explorer
2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
3. Type "Concatenate Selected Files"
4. Choose the files you want to include

Would you like me to elaborate on any part of the extension or explain how it works in more detail?



## Here's my prompt to create this application:

Write a VS Code extension. It should copy the contents of the files selected in the Explorer into a new file. Above the contents from each file should be the relative path, below each file should be a marker. For example:
%% src/main.js &&
(file contents of src.main.js)
%% end %%

I'll help you create a VS Code extension that copies selected files' contents into a new file with the specified formatting. I'll break this down into multiple files and use TypeScript for the implementation.

```typescript
// package.json
{
    "name": "file-concatenator",
    "displayName": "File Concatenator",
    "description": "Copy selected files' contents with file paths and markers",
    "version": "1.0.0",
    "engines": {
        "vscode": "^1.85.0"
    },
    "categories": [
        "Other"
    ],
    "activationEvents": [
        "onCommand:file-concatenator.copySelectedFiles"
    ],
    "main": "./out/extension.js",
    "contributes": {
        "commands": [
            {
                "command": "file-concatenator.copySelectedFiles",
                "title": "Concatenate Selected Files"
            }
        ]
    },
    "scripts": {
        "vscode:prepublish": "npm run compile",
        "compile": "tsc -p ./",
        "watch": "tsc -watch -p ./"
    },
    "devDependencies": {
        "@types/node": "^16.11.7",
        "@types/vscode": "^1.85.0",
        "typescript": "^4.5.4"
    }
}

```

```typescript
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

```

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "sourceMap": true,
        "outDir": "./out",
        "strict": true,
        "noImplicitAny": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": [
        "src/**/*"
    ],
    "exclude": [
        "node_modules",
        ".vscode-test"
    ]
}

```

