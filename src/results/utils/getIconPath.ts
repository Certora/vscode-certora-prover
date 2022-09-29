/* ---------------------------------------------------------------------------------------------
 *  Gets the path to the icon from the media folder.
 *-------------------------------------------------------------------------------------------- */

const mediaPath = document
  .querySelector('meta[data-media-path]')
  .getAttribute('data-media-path')

export function getIconPath(path: string): string {
  return `${mediaPath}/${path.toLowerCase()}`
}
