# Certora Prover for Visual Studio Code

## Usage

1. Install dependencies and build svelte files
```sh
yarn
yarn dev:svelte
```

2. Press F5 for run extension

## Development

1. Issue tracker — GitHub Issues
2. Issue title format

```
[Type] Task

Possible types:

- Results - it is Results tab in activity bar
- Settings - webview with form for settings
- Extension - tasks related to VSCode Extension
- Infrastructure - linters, tasks, githooks, etc.
- All - tasks related to project

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
