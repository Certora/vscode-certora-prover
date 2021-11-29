import { window } from 'vscode'
import axios from 'axios'
import type { Job, ProgressResponse } from './types'

export class ScriptProgressLongPolling {
  private needStop: boolean

  constructor() {
    this.needStop = false
  }

  private async rerun(
    url: string,
    callback: (data: Job) => void,
    ms = 5000,
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
    this.run(url, callback)
  }

  private prepareDataToUI(
    data: ProgressResponse,
    url: string,
  ): Job | undefined {
    try {
      return {
        ...data,
        verificationProgress: data.verificationProgress
          ? JSON.parse(data.verificationProgress)
          : {},
        progressUrl: url,
      }
    } catch (e) {
      throw new Error()
    }
  }

  public async run(url: string, callback: (data: Job) => void): Promise<void> {
    if (this.needStop) {
      this.needStop = false
      return
    }

    try {
      const { data } = await axios.get<ProgressResponse>(url)
      const dataToUI = this.prepareDataToUI(data, url)

      if (data.jobStatus === 'FAILED') {
        window.showErrorMessage(data.cloudErrorMessages.join('. '))
        return
      }

      if (data.jobEnded && dataToUI) {
        callback(dataToUI)
        return
      }

      if (
        data.verificationProgress &&
        data.verificationProgress !== '{}' &&
        dataToUI
      ) {
        callback(dataToUI)
        this.rerun(url, callback)
      } else {
        this.rerun(url, callback)
      }
    } catch (e) {
      window.showErrorMessage(
        `Certora verification service is currently unavailable. Please, try again later.`,
      )
    }
  }

  public stop(): void {
    this.needStop = true
  }
}
