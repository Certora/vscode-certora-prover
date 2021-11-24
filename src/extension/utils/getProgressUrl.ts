export function getProgressUrl(text: string): string | null {
  if (!text.includes('You can follow up on the status:')) return null

  const urlRegex = /(https?:\/\/[^ ]*)/
  const urlMatches = text.replace(/\r/g, ' ').match(urlRegex)

  if (urlMatches) {
    const [, url] = urlMatches

    return url.includes('jobStatus')
      ? url.replace('jobStatus', 'progress')
      : null
  }

  return null
}
