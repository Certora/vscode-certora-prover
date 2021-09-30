// TODO: I couldn't find better solution than provide path to media folder from webview provider
export function getIconPath(path: string) {
  return mediaPath + path
}
