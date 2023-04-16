/* ---------------------------------------------------------------------------------------------
 *  Gets the progress url / creation time url, by string processsing.
 *-------------------------------------------------------------------------------------------- */

export function getProgressUrl(text: string): string | null {
  // if (!text.includes('You can follow up on the status:')) {
  //   return null
  // }

  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urlMatches = text.match(urlRegex)

  console.log(urlMatches, 'urlMatch')

  if (urlMatches) {
    const url = urlMatches[1]
    console.log(url, 'urlMatch2')
    return url.includes('output') ? url.replace('output', 'progress') : null
  }
  return null
}

export function getCreationTimeUrl(url: string): string | null {
  return url.includes('progress')
    ? url.replace('progress', 'jobData') + '&attr=postTime'
    : null
}
