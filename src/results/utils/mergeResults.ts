import type { Job } from '../types'

export function mergeResults(results: Job[], newResult: Job): Job[] {
  if (results.length === 0) {
    return [newResult]
  }

  return results.reduce((acc, curr, i) => {
    if (
      curr.jobId === newResult.jobId ||
      curr.verificationProgress.contract ===
        newResult.verificationProgress.contract
    ) {
      acc[i] = newResult
    } else {
      acc.push(newResult)
    }

    return acc
  }, results)
}
