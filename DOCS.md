# Certora Prover for Visual Studio Code

## About

The extension contains three parts:

- extension core
- results tab
- settings page

#### Extension core

This part of the extension contains business logic. Init webview for results and settings, run `certoraRun` script, watch `*.sol`, `*.spec` and `*.conf` files, function for creating `*.conf` file, navigate to code.

**Technologies:**

TypeScript, [VSCode API](https://code.visualstudio.com/api), Axios.

**Used parts of VSCode API:**

- [API for create Results tab webview](https://code.visualstudio.com/api/references/vscode-api#window.registerWebviewViewProvider)
- [API for create Settings page webview](https://code.visualstudio.com/api/references/vscode-api#window.createWebviewPanel)
- APIs for navigate to code: [openTextDocument](https://code.visualstudio.com/api/references/vscode-api/#workspace.openTextDocument), [showTextDocument](https://code.visualstudio.com/api/references/vscode-api/#workspace.showTextDocument), [revealRange](https://code.visualstudio.com/api/references/vscode-api/#TextEditor.revealRange)
- [API for watching files](https://code.visualstudio.com/api/references/vscode-api/#workspace.createFileSystemWatcher)
- [API for find files](https://code.visualstudio.com/api/references/vscode-api/#workspace.findFiles)
- [QuickPick API (the dropdown for select .conf file before run the script)](https://code.visualstudio.com/api/references/vscode-api#window.createQuickPick)
- [Webview Documentation](https://code.visualstudio.com/api/extension-guides/webview)

#### Results and Settings

Built with [Svelte](https://svelte.dev/docs) + TypeScript + PostCSS, [@vscode/codicons](https://github.com/microsoft/vscode-codicons), [@vscode/webview-ui-toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit)

## Fragile parts of extension

1. The function for getting progress url

```ts
export function getProgressUrl(text: string): string | null {
  if (!text.includes('You can follow up on the status:')) return null

  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urlMatches = text.match(urlRegex)

  if (urlMatches) {
    const [url] = urlMatches

    return url.includes('jobStatus')
      ? url.replace('jobStatus', 'progress')
      : null
  }

  return null
}
```

If stdout in the `certoraRun` script changes, then the extension will break.

2. We don't validate the Settings form, so a user can create an incorrect `conf` file.

## Usage

#### Dev

1. Install dependencies and build `svelte` files

```sh
yarn
yarn dev:svelte
```

2. Press F5 to run the extension

#### Prod

1. Build `*.vsix` file

```sh
npx vsce package
```

## Debug

1. Press `CTRL/CMD + Shift + P`
2. Run command `Developer: Open Webview Developer Tools`

![debug](assets/debug-command.jpg)

3. You will see log for any action

![logs](assets/logs.jpg)

4. Log item structure

```
{
  action: string // action description
  source: 'Results webview' | 'Settings webview' | 'Extension' // The part of the extension in which the action was called
  info?: any // Any additional information
}
```

## Development processes

1. Issue tracker — GitHub Issues
2. Issue title format

```
[Type] Task

Possible types:

- Results - Results tab in the activity bar
- Settings - Webview with form for creating a configuration file
- Extension - Tasks related to the VSCode extension
- Infrastructure - linters, tasks, githooks, etc.
- All - tasks related to the project

For example:

[Results] Realize VSCode Panel component
```

3. Issue description format

Without format. Write as needed

4. Branch name format

```
feature/{short description}
bug/{short description}
```

5. Commit name format

```
#{issue number}: What did you do
```

6. Issue labels (task status)

```
To do
In progress
In review
Done
```

7. Naming

Use kebab-case for directories

```
mock-files
```

Use case same exported entity

```ts
export function getIconPath(path: string) {
  return mediaPath + path
}
```

```
getIconPath.ts
```

Use PascalCase for UI components

```
TreeItem.svelte
```
