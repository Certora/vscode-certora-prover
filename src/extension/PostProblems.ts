import {
  workspace,
  Uri,
  Diagnostic,
  Position,
  Range,
  DiagnosticCollection,
} from 'vscode'
import * as vscode from 'vscode'
import type { ResourceError } from './types'

/**
 *  post problems from resource_errors.json the the PROBLEMS view of vscode
 */
export const PostProblems = {
  diagnosticCollection: [] as DiagnosticCollection[],

  /** public methods: */

  /**
   * resets all diagnostic collections, should be called in the beginning of a ScriptRunner run
   */
  resetDiagnosticCollection(): void {
    this.diagnosticCollection.forEach(collection => {
      collection.clear()
    })
    this.diagnosticCollection = []
  },

  /**
   * Posting errors from 'resource_errors.json' to vscode 'PROBLEMS'
   * @param confFile relative path to the .conf file of the current run
   * @param ts the time stamp when the run happened
   * @returns an empty promise
   */
  async postProblems(confFile: string, ts: number): Promise<void> {
    const resourceErrorsFile = 'resource_errors.json'
    const found = await this.findFile(resourceErrorsFile)

    if (!found || !found[0]) {
      console.error(
        "Could't find the " +
          resourceErrorsFile +
          ' file. Please contact Certora team',
      )
      return
    }

    const data = await vscode.workspace.fs.readFile(found[0])
    if (!data) {
      console.error(
        "Couldn't locate the error logs. Please contact Certora team",
      )
      return
    }

    const decoder = new TextDecoder()
    const content = decoder.decode(data)
    const resource_error = this.getResourceError(content)

    this.createAndPostDiagnostics(resource_error, confFile, ts)
  },

  /** private methods: */

  /** returns a pattern to only watch the files that have problems */
  getPattern(): string {
    const wsFolder = vscode.workspace.workspaceFolders?.[0].uri
    if (!wsFolder) {
      return '**/'
    }
    const uriPatterns: string[] = []
    this.diagnosticCollection.forEach(collection => {
      collection.forEach(uri => {
        // eslint-disable-next-line prettier/prettier
        const relativePath = uri.path.split(wsFolder.path + '/').join()
        uriPatterns.push(relativePath)
      })
    })
    const stringPattern = uriPatterns.join(',')
    return `**/*{${stringPattern}}`
  },

  /**
   * when user edits the file where problem originated, clear related diagnostics
   */
  async deleteOnEdit(): Promise<void> {
    // counts the diagnostic collections left
    let diagnosticCollectionsLength: number = this.diagnosticCollection.length
    const folder = workspace.workspaceFolders?.[0]
    const pattern = this.getPattern()
    if (folder) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(folder, pattern),
      )
      watcher.onDidChange(uri => {
        this.diagnosticCollection.forEach(collection => {
          collection.forEach(diagnosticUri => {
            if (uri.path === diagnosticUri.path) {
              collection.clear()
              diagnosticCollectionsLength -= 1
            }
            // if no more diagnostics left - stop watching
            if (diagnosticCollectionsLength === 0) {
              this.diagnosticCollection = []
              watcher.dispose()
            }
          })
        })
      })
    }
  },

  /**
   * Creates the diagnostics and posts them.
   * A diagnostic will link to the file the error originated from if a path to such file exists in the message.
   * If not - the diagnostic will link to the .conf.log file of the current run.
   * @param resource_error json content of resource_error.json
   * @param confFile a relative path to this run .conf file
   * @param ts the timestamp of the current run
   */
  async createAndPostDiagnostics(
    resource_error: ResourceError,
    confFile: string,
    ts: number,
  ): Promise<void> {
    /**
     * regex to find a file path in a string. example:
     * string: "BankLesson/Bank.sol:22:5: ParserError: Expected ';' but got 'function'"
     * pathRegex will find: BankLesson/Bank.sol
     * (changes to include relative paths)
     */
    const pathRegex = /([a-z0-9_\-\\/.]+)\.([a-z0-9]+)/i
    const locationRegex = /((:\d+:\d+:)|(:\d+:\d+))/g

    const diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map()

    for (const topic of resource_error.topics) {
      for (const message of topic.messages) {
        const curMessage: string = message.message

        const regexPathArray = pathRegex.exec(curMessage)
        const regexLocationArray = locationRegex.exec(curMessage)

        const logFilePath = this.getLogFilePath(confFile, ts)
        if (!logFilePath) {
          return
        }

        const path = await this.getPathToProblem(regexPathArray, logFilePath)

        const descriptiveMessage = curMessage
          .replace(pathRegex, '')
          .replace(locationRegex, '')
          .replace(' ()', '') // for dealing with spec file errors messages

        const position: Position = this.getPosition(
          regexLocationArray,
          path,
          logFilePath,
        )
        /**
         * right now we are only getting the start position from the resource_errors.json message
         * vscode handles this range by emphasizing the words that start at position [position]
         */
        const diagnostic: Diagnostic = this.createDiagnostic(
          position,
          position,
          descriptiveMessage,
        )
        this.setDiagnosticMap(diagnostic, path, diagnosticMap)
      }
    }
    this.postDiagnostics(diagnosticMap)
  },

  /**
   * returns a new diagnostic object
   * @param startPosition position where the problem starts
   * @param endPosition position where the problem ends
   * @param message message describing the problem
   * @returns diagnostic object
   */
  createDiagnostic(
    startPosition: Position,
    endPosition: Position,
    message: string,
  ): Diagnostic {
    const range: Range = new Range(startPosition, endPosition)
    const diagnostic = new Diagnostic(range, message)
    return diagnostic
  },

  /**
   * sets the diagnostic map [diagnosticMap] with the new value:
   * @param diagnostic Diagnostic object
   * @param path path to the file where problems originated from
   * @param diagnosticMap maps paths (string) to diagnostic lists
   */
  setDiagnosticMap(
    diagnostic: Diagnostic,
    path: string,
    diagnosticMap: Map<string, Diagnostic[]>,
  ): void {
    const diagnostics: Diagnostic[] = diagnosticMap.get(path) || []
    diagnostics.push(diagnostic)
    diagnosticMap.set(path, diagnostics)
  },

  /**
   * post all diagnostic lists in diagnosticMap to [PROBLEMS]
   * @param diagnosticMap maps paths (string) to diagnostic lists
   */
  postDiagnostics(diagnosticMap: Map<string, Diagnostic[]>): void {
    diagnosticMap.forEach((diagnosticList, path) => {
      const curDiagnosticCollection: vscode.DiagnosticCollection =
        vscode.languages.createDiagnosticCollection()
      curDiagnosticCollection.set(Uri.parse(path), diagnosticList)
      this.diagnosticCollection.push(curDiagnosticCollection)
    })
    // when user edits file with diagnostics - clear related diagnostics
    if (this.diagnosticCollection.length > 0) {
      this.deleteOnEdit()
    }
  },

  getResourceError(str: string): ResourceError {
    try {
      const jsonContent: ResourceError = JSON.parse(str)
      return jsonContent
    } catch (e) {
      console.error("Couldn't read the error logs. Please contact Certora team")
      const resource_error: ResourceError = {
        topics: [],
      }
      return resource_error
    }
  },

  async findFile(filepath: string): Promise<Uri[]> {
    const ignoreFolderRegex =
      '**/{.certora_config,.git,.last_confs,node_modules,certora-logs,conf,.github,images,cache}/**'
    const found = await vscode.workspace.findFiles(
      '**/' + filepath,
      ignoreFolderRegex,
      1,
    )
    return found
  },

  async relativeToFullPath(uri: Uri): Promise<Uri> {
    // check if this is already a full path
    try {
      await workspace.fs.readFile(uri)
      return uri
    } catch (e) {
      // if it is not - find first uri that matched the relative path
      const pathAsArray = uri.path.split('/')
      const fileName = pathAsArray[pathAsArray.length - 1]
      const fullPath = await this.findFile(fileName)
      if (!fullPath || !fullPath[0]) {
        return uri
      }
      return fullPath[0]
    }
  },

  getPosition(
    location: RegExpExecArray | null,
    path: string,
    logFilePath: Uri,
  ): Position {
    if (!(path === logFilePath.path) && location && location[0]) {
      const [row, col] = location[0].split(':').filter(element => {
        return element !== ''
      })

      // Position object assumes the indexes given to it are starting with 0 while vscode code lines indexes are starting with 1.
      const rowPosition = parseInt(row) - 1
      const colPosition = parseInt(col) - 1
      return new Position(rowPosition, colPosition)
    }
    return new Position(0, 0)
  },

  /**
   * Returns a path to the file where the problem originated from. If the function did not get a file path in [path],
   * the function returns a path to the .conf file of the current run.
   * @param path RegExpExecArray contains a path to the file, as was received from the resource_file.json message
   * @param logFilePath uri with path to a .conf file of the certora IDE, of the current run.
   * @returns a path to the file where the problem originated from, or a path to the .conf file
   */
  async getPathToProblem(
    path: RegExpExecArray | null,
    logFilePath: Uri,
  ): Promise<string> {
    let pathToReturn = logFilePath.path

    if (path && path[0]) {
      const fileUri = Uri.parse(path[0])

      // vscode API way to check if a file exists
      try {
        const fullPathUri = await this.relativeToFullPath(fileUri)
        await workspace.fs.readFile(fullPathUri)
        pathToReturn = fullPathUri.path
      } catch (e) {}
    }
    return pathToReturn
  },

  /**
   * returns a uri of the conf.log file if the workspace path exists, null otherwise
   * @param pathToConfFile path to the .conf file (relative)
   * @param ts the time the file was created
   * @returns the full path to the conf.log file or null
   */
  getLogFilePath(pathToConfFile: string, ts: number): Uri | undefined {
    const path = workspace.workspaceFolders?.[0]
    if (!path) return

    const splittedPathToConfFile: string[] = pathToConfFile.split('/')
    const unitedPathToConfFile: string =
      splittedPathToConfFile[splittedPathToConfFile.length - 1]

    const logFilePath = Uri.joinPath(
      path.uri,
      'certora-logs',
      `${unitedPathToConfFile}-${ts}.log`,
    )
    return logFilePath
  },
}
