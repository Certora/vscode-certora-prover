import { FileType, Uri, workspace } from 'vscode'
import { CERTORA_INNER_DIR, CONF_DIRECTORY } from '../types'
import { checkDir } from './checkDir'

/**
 * returns a uri of the conf.log file if the workspace path exists, null otherwise
 * @returns the full path to the conf.log file or null
 */
export async function getInternalDirPath(
  pathToConfFile: string,
): Promise<Uri | undefined> {
  const path =
    pathToConfFile?.split(CONF_DIRECTORY)[0] ||
    workspace.workspaceFolders?.[0]?.uri.path
  if (!path) return

  const internalUri = Uri.parse(path + CERTORA_INNER_DIR)
  const checked = await checkDir(internalUri)
  if (checked) {
    let innerDirs: [string, FileType][] = await workspace.fs.readDirectory(
      internalUri,
    )
    innerDirs = innerDirs.filter(dir => {
      return dir[0] !== 'last_results'
    })

    const reg = /^[0-9_]+$/

    const dates = innerDirs
      .map(file => {
        return file[0]
      })
      .filter(name => {
        return reg.exec(name)
      })
      .sort((str1, str2) => {
        return str1 > str2 ? -1 : 1
      })

    // get the most recent date / dir
    const curDate = dates[0]

    if (curDate) {
      const resourceErrorsPath = Uri.joinPath(internalUri, curDate)
      return resourceErrorsPath
    }
  }
}
