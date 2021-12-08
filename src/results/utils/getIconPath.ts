// TODO: I couldn't find better solution than provide path to media folder from webview provider
const mediaPath = document
  .querySelector('meta[data-media-path]')
  .getAttribute('data-media-path')

export function getIconPath(path: string): string {
  return `${mediaPath}/${path.toLowerCase()}`
}
