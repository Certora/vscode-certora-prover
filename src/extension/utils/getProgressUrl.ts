/* ---------------------------------------------------------------------------------------------
 *  Gets the progress url / creation time url, by string processing.
 *-------------------------------------------------------------------------------------------- */

export function getProgressUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urlMatches = text.match(urlRegex)

  if (urlMatches) {
    const url = urlMatches.find(url => {
      return url.includes('output')
    })
    if (url?.includes('output')) {
      return url.replace('output', 'progress')
    } else if (url?.includes('jobStatus')) {
      return url.replace('jobStatus', 'progress')
    }
  }
  return null
}

export function getCreationTimeUrl(url: string): string | null {
  return url.includes('progress')
    ? url.replace('progress', 'jobData') + '&attr=postTime'
    : null
}
