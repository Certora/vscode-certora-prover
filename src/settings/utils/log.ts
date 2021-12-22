// In the future we will add it to VSCode Settings and will take DEBUG value
// from there
const DEBUG = true

export enum Sources {
  ResultsWebview = 'Results webview',
  SettingsWebview = 'Settings webview',
  Extension = 'Extension',
}

export function log({
  action,
  source,
  info,
}: {
  action: string
  source: Sources
  info?: unknown
}): void {
  if (!DEBUG) return

  const printedObject = info ? { action, source, info } : { action, source }

  console.log(printedObject)
}
