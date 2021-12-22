import { window } from 'vscode'
import axios from 'axios'
import type { Job, ProgressResponse } from './types'

export class ScriptProgressLongPolling {
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
    try {
      const { data } = await axios.get<ProgressResponse>(url)
      const dataToUI = this.prepareDataToUI(data, url)

      if (data.jobStatus === 'FAILED') {
        window.showErrorMessage(data.cloudErrorMessages.join('. '))
        return
      }

      if (data.jobEnded && data.jobStatus === 'SUCCEEDED' && dataToUI) {
        if (Object.keys(dataToUI.verificationProgress).length === 0) {
          window.showErrorMessage(
            `Job ${dataToUI.jobId} completed successfully, with an empty output. Please contact Certora team`,
          )
          return
        }

        callback(dataToUI)
        window.showInformationMessage(
          `Job ${dataToUI.jobId} completed successfully. Checked spec file: ${dataToUI.verificationProgress.spec}`,
        )
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
}
