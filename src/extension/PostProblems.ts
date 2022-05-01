import {
  workspace,
  Uri,
  Diagnostic,
  Position,
  Range,
  DiagnosticCollection,
  window,
  RelativePattern,
  languages,
} from 'vscode'
import type { ResourceError } from './types'

/**
 *  post problems from resource_errors.json the the PROBLEMS view of vscode
 */
export abstract class PostProblems {
  private static diagnosticCollection: DiagnosticCollection =
    languages.createDiagnosticCollection()

  /** public methods: */

  /**
   * resets all diagnostic collections, should be called in the beginning of a ScriptRunner run
   */
  public static resetDiagnosticCollection(): void {
    this.diagnosticCollection.clear()
    this.diagnosticCollection = languages.createDiagnosticCollection()
  }

  /**
   * Posting errors from 'resource_errors.json' to vscode 'PROBLEMS'
   * @param confFile relative path to the .conf.log file of the current run
   * @returns an empty promise
   */
  public static async postProblems(confFile: string): Promise<void> {
    const resourceErrorsFile = 'resource_errors.json' // todo: change this back
    const fileUri = this.getFullFilePath(resourceErrorsFile)
    if (!fileUri) {
      return
    }

    try {
      await workspace.fs.stat(fileUri)
    } catch (e) {
      window.showErrorMessage(
        "Could't find the " +
          resourceErrorsFile +
          ' file. Please contact Certora team',
      )
      return
    }

    const data = await workspace.fs.readFile(fileUri)
    if (!data) {
      window.showErrorMessage(
        "Couldn't locate the error logs. Please contact Certora team",
      )
      return
    }

    const decoder = new TextDecoder()
    const content = decoder.decode(data)
    const resource_error = this.getResourceError(content)

    this.createAndPostDiagnostics(resource_error, confFile)
  }

  /** private methods: */

  /** returns a pattern to only watch the files that have problems */
  private static getPatternForFilesToWatch(): string {
    const uriPatterns: string[] = []
    this.diagnosticCollection.forEach(uri => {
      const relativePath = workspace.asRelativePath(uri)
      uriPatterns.push(relativePath)
    })
    const stringPattern = uriPatterns.join(',')
    return `**/*{${stringPattern}}`
  }

  /**
   * when user edits the file where problem originated, clear related diagnostics
   */
  private static async deleteOnEdit(): Promise<void> {
    const folder = workspace.workspaceFolders?.[0]
    const pattern = this.getPatternForFilesToWatch()
    if (folder) {
      const watcher = workspace.createFileSystemWatcher(
        new RelativePattern(folder, pattern),
      )
      watcher.onDidChange(uri => {
        this.diagnosticCollection.forEach(diagnosticUri => {
          console.log('watch')
          if (uri.path === diagnosticUri.path) {
            this.diagnosticCollection.delete(diagnosticUri)
          }
        })
      })
    }
  }

  /**
   * Creates the diagnostics and posts them.
   * A diagnostic will link to the file the error originated from if a path to such file exists in the message.
   * If not - the diagnostic will link to the .conf.log file of the current run.
   * @param resource_error json content of resource_error.json
   * @param confFile a relative path to this run .conf file
   */
  private static async createAndPostDiagnostics(
    resource_error: ResourceError,
    confFile: string,
  ): Promise<void> {
    /**
     * regex to find a file path in a string. example:
     * string: "BankLesson/Bank.sol:22:5: ParserError: Expected ';' but got 'function'"
     * pathRegex will find: BankLesson/Bank.sol
     * (changes to include relative paths)
     */
    const pathRegex = /([a-z0-9_\-\\/.]+)\.([a-z]+)/i
    const locationRegex = /((:\d+:\d+:)|(:\d+:\d+))/g

    const diagnosticMap: Map<string, Diagnostic[]> = new Map()

    for (const topic of resource_error.topics) {
      for (const message of topic.messages) {
        const curMessage: string = message.message

        const regexPathArray = pathRegex.exec(curMessage)
        const regexLocationArray = locationRegex.exec(curMessage)

        const logFilePath = this.getFullFilePath(confFile)
        if (!logFilePath) {
          return
        }

        const path = await this.getPathToProblem(regexPathArray, logFilePath)

        const descriptiveMessage = curMessage
          .replace(pathRegex, '')
          .replace(locationRegex, '')
          .replace(' ()', '') // for dealing with spec file errors messages (SomeSpec.spec:1:1)

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
  }

  /**
   * returns a new diagnostic object
   * @param startPosition position where the problem starts
   * @param endPosition position where the problem ends
   * @param message message describing the problem
   * @returns diagnostic object
   */
  private static createDiagnostic(
    startPosition: Position,
    endPosition: Position,
    message: string,
  ): Diagnostic {
    const range: Range = new Range(startPosition, endPosition)
    const diagnostic = new Diagnostic(range, message)
    return diagnostic
  }

  /**
   * sets the diagnostic map [diagnosticMap] with the new value:
   * @param diagnostic Diagnostic object
   * @param path path to the file where problems originated from
   * @param diagnosticMap maps paths (string) to diagnostic lists
   */
  private static setDiagnosticMap(
    diagnostic: Diagnostic,
    path: string,
    diagnosticMap: Map<string, Diagnostic[]>,
  ): void {
    const diagnostics: Diagnostic[] = diagnosticMap.get(path) || []
    diagnostics.push(diagnostic)
    diagnosticMap.set(path, diagnostics)
  }

  /**
   * post all diagnostic lists in diagnosticMap to [PROBLEMS]
   * @param diagnosticMap maps paths (string) to diagnostic lists
   */
  private static postDiagnostics(
    diagnosticMap: Map<string, Diagnostic[]>,
  ): void {
    const result: Array<[Uri, readonly Diagnostic[] | undefined]> = []
    diagnosticMap.forEach((diagnostics, path) => {
      result.push([Uri.parse(path), diagnostics])
    })
    this.diagnosticCollection.set(result)
    // when user edits file with diagnostics - clear related diagnostics
    if (this.diagnosticCollection) {
      this.deleteOnEdit()
    }
  }

  private static getResourceError(str: string): ResourceError {
    try {
      const jsonContent: ResourceError = JSON.parse(str)
      return jsonContent
    } catch (e) {
      console.error("Couldn't read the error logs.")
      const resource_error: ResourceError = {
        topics: [],
      }
      return resource_error
    }
  }

  private static async findFile(filepath: string): Promise<Uri[]> {
    const ignoreFolderRegex =
      '**/{.certora_config,.git,.last_confs,node_modules,certora-logs,conf,.github,images,cache}/**'
    const found = await workspace.findFiles(
      '**' + filepath,
      ignoreFolderRegex,
      1,
    )
    return found
  }

  private static async relativeToFullPath(uri: Uri): Promise<Uri> {
    // check if this is already a full path
    try {
      await workspace.fs.stat(uri)
      return uri
    } catch (e) {
      const fullPath = await this.findFile(uri.path)
      if (fullPath && fullPath[0]) {
        return fullPath[0]
      }
      return uri
    }
  }

  private static getPosition(
    location: RegExpExecArray | null,
    path: string,
    logFilePath: Uri,
  ): Position {
    if (path !== logFilePath.path && location && location[0]) {
      const [row, col] = location[0].split(':').filter(element => {
        return element !== ''
      })

      // Position object assumes the indexes given to it are starting with 0 while vscode code lines indexes are starting with 1.
      const rowPosition = parseInt(row) - 1
      const colPosition = parseInt(col) - 1
      return new Position(rowPosition, colPosition)
    }
    return new Position(0, 0)
  }

  /**
   * Returns a path to the file where the problem originated from. If the function did not get a file path in [path],
   * the function returns a path to the .conf file of the current run.
   * @param path RegExpExecArray contains a path to the file, as was received from the resource_file.json message
   * @param logFilePath uri with path to a .conf file of the certora IDE, of the current run.
   * @returns a path to the file where the problem originated from, or a path to the .conf file
   */
  private static async getPathToProblem(
    path: RegExpExecArray | null,
    logFilePath: Uri,
  ): Promise<string> {
    let pathToReturn = logFilePath.path

    if (path && path[0]) {
      const fileUri = Uri.parse(path[0])

      // vscode API way to check if a file exists
      try {
        const fullPathUri = await this.relativeToFullPath(fileUri)
        await workspace.fs.stat(fullPathUri)
        pathToReturn = fullPathUri.path
      } catch (e) {}
    }
    return pathToReturn
  }

  /**
   * returns a uri of the conf.log file if the workspace path exists, null otherwise
   * @param relativePath relative path to a file in the workspace folder
   * @returns the full path to the conf.log file or null
   */
  private static getFullFilePath(relativePath: string): Uri | undefined {
    const path = workspace.workspaceFolders?.[0]
    if (!path) return

    const fullPath = Uri.joinPath(path.uri, `${relativePath}`)
    return fullPath
  }
}
