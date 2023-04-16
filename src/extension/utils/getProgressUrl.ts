/* ---------------------------------------------------------------------------------------------
 *  Gets the progress url / creation time url, by string processsing.
 *-------------------------------------------------------------------------------------------- */

export function getProgressUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urlMatches = text.match(urlRegex)

  if (
    urlMatches &&
    urlMatches.find(url => {
      return url.includes('anonymousKey')
    })
  ) {
    const url = urlMatches.find(url => {
      return url.includes('anonymousKey')
    })
    return url?.includes('output') ? url.replace('output', 'progress') : null
  }
  return null
}

export function getCreationTimeUrl(url: string): string | null {
  return url.includes('progress')
    ? url.replace('progress', 'jobData') + '&attr=postTime'
    : null
}
