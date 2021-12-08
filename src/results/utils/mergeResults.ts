import type { Job } from '../types'

export function mergeResults(results: Job[], newResult: Job): void {
  const index = results.findIndex(
    item =>
      item.jobId === newResult.jobId ||
      item.verificationProgress.contract ===
        newResult.verificationProgress.contract,
  )

  if (index > -1) {
    results[index] = newResult
  } else {
    results.push(newResult)
  }
}
