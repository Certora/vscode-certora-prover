import { window } from 'vscode'
import axios from 'axios'

export type ProgressResponse = {
  jobId: string
  jobStatus: string
  jobEnded: boolean
  cloudErrorMessages: string[]
  verificationProgress: string
}

export class ScriptProgressLongPolling {
  private needStop: boolean

  constructor() {
    this.needStop = false
  }

  public async run(
    url: string,
    callback: (data: ProgressResponse) => void,
  ): Promise<void> {
    if (this.needStop) {
      this.needStop = false
      return
    }

    try {
      const { data } = await axios.get<ProgressResponse>(url)

      if (data.jobEnded) {
        callback(data)
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000))
        this.run(url, callback)
      }
    } catch (e) {
      window.showErrorMessage(`${e}`)
    }
  }

  public stop(): void {
    this.needStop = true
  }
}
