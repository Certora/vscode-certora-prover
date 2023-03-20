import { FileType, Uri, workspace } from 'vscode'
import { CERTORA_INNER_DIR } from '../types'
import { checkDir } from './checkDir'

/**
 * returns a Date if possible, null if not possible
 * @param dir string in the format of 22_12_05_14_22_09_BLA
 * @returns date object
 */
export function getDateFormat(dir: string): [Date, string] {
  const arr = dir.split('_').slice(0, 6)
  const dateStr = '20' + arr.slice(0, 3).join('-') + 'T'
  const timeStr = arr.slice(3, 6).join(':') + 'Z'
  const str = dateStr + timeStr
  return [new Date(str), dir]
}

/**
 * returns a uri of the conf.log file if the workspace path exists, null otherwise
 * @returns the full path to the conf.log file or null
 */
export async function getInternalDirPath(): Promise<Uri | undefined> {
  const path = workspace.workspaceFolders?.[0]
  if (!path) return

  const internalUri = Uri.parse(path.uri.path + CERTORA_INNER_DIR)
  const checked = await checkDir(internalUri)
  if (checked) {
    let innerDirs: [string, FileType][] = await workspace.fs.readDirectory(
      internalUri,
    )
    innerDirs = innerDirs.filter(dir => {
      return dir[0] !== '.last_results'
    })
    const dates: ([Date, string] | null)[] = innerDirs.map(
      (dir: [string, FileType]) => {
        if (dir[1] === 2) {
          return getDateFormat(dir[0])
        }
        return null
      },
    )
    // filter out null values
    const datesNew = dates.filter(date => {
      return date && date[0]
    })

    // sort by date
    const sortedDates = datesNew.sort(function (a, b) {
      if (a !== null && b !== null) {
        return a[0] > b[0] ? -1 : 1
      }
      return 0
    })

    // get the most recent date / dir
    const curDate = sortedDates[0]

    if (curDate) {
      const resourceErrorsPath = Uri.joinPath(internalUri, curDate[1])
      return resourceErrorsPath
    }
  }
}
