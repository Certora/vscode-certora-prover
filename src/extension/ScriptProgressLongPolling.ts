/* ---------------------------------------------------------------------------------------------
 *  run job and receive job results
 *-------------------------------------------------------------------------------------------- */

import { window } from 'vscode'
import axios from 'axios'
import type { Job, ProgressResponse } from './types'
import { getCreationTimeUrl } from './utils/getProgressUrl'
import type { CreationTime } from '../results/types'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'

export class ScriptProgressLongPolling {
  private readonly resultsWebviewProvider: ResultsWebviewProvider
  constructor(resultsWebviewProvider: ResultsWebviewProvider) {
    this.resultsWebviewProvider = resultsWebviewProvider
  }

  private async rerun(
    url: string,
    confPath: string,
    callback: (data: Job) => void,
    ms = 5000,
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
    this.run(url, confPath, callback)
  }

  private async prepareDataToUI(
    data: ProgressResponse,
    url: string,
  ): Promise<Job | undefined> {
    let postTime = ''
    try {
      if (url) {
        const creationTimeUrl = getCreationTimeUrl(url)
        if (creationTimeUrl) {
          const { data } = await axios.get<CreationTime>(creationTimeUrl)
          postTime = data.postTime
        }
      }
    } catch (e) {
      console.log(e)
    }
    try {
      return {
        ...data,
        verificationProgress: data.verificationProgress
          ? JSON.parse(data.verificationProgress)
          : {},
        progressUrl: url,
        creationTime: postTime,
      }
    } catch (e) {
      console.log('error occurred on prepareDataToUI')
      throw new Error()
    }
  }

  public async run(
    url: string,
    confPath: string,
    callback: (data: Job) => void,
  ): Promise<void> {
    try {
      console.log(confPath, 'url from polling')
      const { data } = await axios.get<ProgressResponse>(url)
      const dataToUI = await this.prepareDataToUI(data, url)

      if (data.jobStatus === 'FAILED' && dataToUI) {
        callback(dataToUI)
        return
      }

      if (data.jobEnded && data.jobStatus === 'SUCCEEDED' && dataToUI) {
        // if (!Object.keys(dataToUI.verificationProgress).length) {
        // }

        callback(dataToUI)
        return
      }

      if (data.jobEnded && dataToUI) {
        console.log('Job ended with status: ', data?.jobStatus)
        callback(dataToUI)
        return
      }

      if (
        data.verificationProgress &&
        data.verificationProgress !== '{}' &&
        dataToUI
      ) {
        callback(dataToUI)
        this.rerun(url, confPath, callback)
      } else {
        this.rerun(url, confPath, callback)
      }
    } catch (e) {
      this.resultsWebviewProvider.postMessage({
        type: 'parse-error',
        payload: confPath,
      })
      window.showErrorMessage(
        `Certora verification service is currently unavailable. Please, try again later. ${e}`,
      )
    }
  }
}
