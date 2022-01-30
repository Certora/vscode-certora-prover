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

export function getCreationTimeUrl(url: string): string | null {
  return url.includes('progress')
    ? url.replace('progress', 'jobData') + '&attr=postTime'
    : null
}
