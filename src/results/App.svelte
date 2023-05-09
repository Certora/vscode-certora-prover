<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Main file of the Results part of the extension.
   *  creates runs under MY RUNS pane, creates action buttons, sends actions
   *  like edit, run etc.
   *-------------------------------------------------------------------------------------------- */

  import { onMount, onDestroy } from 'svelte'
  import Select from 'svelte-select'
  import {
    runScript,
    initResults,
    uploadConf,
    getLastResults,
    UploadDir,
    getDirs,
  } from './extension-actions'
  import { log, Sources } from './utils/log'
  import {
    Output,
    EventsFromExtension,
    Run,
    JobNameMap,
    Status,
    jobList,
    ConfToCreate,
  } from './types'
  import { CallTraceFunction, EventTypesFromExtension } from './types'
  import CustomItem from './components/CustomItem.svelte'
  import CustomList from './components/CustomList.svelte'
  import ClearIcon from './components/ClearIcon.svelte'
  import Icon from './components/Icon.svelte'
  import { writable } from 'svelte/store'
  import {
    CERTORA_CONF,
    JOB_LIST,
    jobLists,
    verificationResults,
  } from './store/store'
  import JobList from './components/JobList.svelte'
  import ResultsOutput from './components/ResultsOutput.svelte'
  import { manageFiles } from './utils/refreshFiles'

  const BROWSE = 'Browse...'

  export const focusedRun = writable('')

  export let outputRunName: string = ''

  let output: Output
  let selectedCalltraceFunction: CallTraceFunction

  let runningScripts: { pid: number; confFile: string; uploaded: boolean }[] =
    []
  let pendingQueue: JobNameMap[] = []
  let pendingQueueCounter = 0

  let workspaceDirPath = ''

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.UploadingFiles: {
        log({
          action: 'Received "run-next" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        runNext()
        break
      }
      case EventTypesFromExtension.EmptyWorkspace: {
        log({
          action: 'Received "empty-workspace" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        workspaceDirPath = e.data.payload
        break
      }
      case EventTypesFromExtension.RunningScriptChanged: {
        log({
          action: 'Received "running-scripts-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        if (!e.data.payload) return
        runningScripts = e.data.payload
        if (!e.data.payload.length) {
          runNext()
        }
        // no empty job list
        $jobLists = $jobLists.filter(js => {
          return js.children.length || js.runs.length
        })
        break
      }
      case EventTypesFromExtension.SetOutput: {
        log({
          action: 'Received "get-output" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        if (
          e.data.payload &&
          ((e.data.payload.callResolution &&
            e.data.payload.callResolution.length) ||
            (e.data.payload.variables && e.data.payload.variables.length))
        ) {
          output = e.data.payload
        }
        break
      }
      case EventTypesFromExtension.FocusChanged: {
        log({
          action: 'Received "focus-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        $focusedRun = e.data.payload
        break
      }
      case EventTypesFromExtension.InitialJobs: {
        log({
          action: 'Received "initial-jobs" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // when we get the last results we don't want to create new job items
        if (!$jobLists.length) {
          createInitialJobs(e.data.payload)
        } else {
          changeJobs(e.data.payload)
        }

        break
      }
      case EventTypesFromExtension.GetDirChoice: {
        log({
          action: 'Received "get-dir-choice" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        updateChosenFile(e.data.payload)
        break
      }
      case EventTypesFromExtension.FilesFromWorkspace: {
        log({
          action: 'Received "files-from-workspace" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        const tempFiles = e.data.payload
        let processedFiles = tempFiles.map(file => {
          const tempArr = file.split('/').filter(item => item)
          const label = tempArr[tempArr.length - 1]
          return {
            value: file,
            path: label,
            label: tempArr.join('/'),
          }
        })
        const browseItem = {
          value: BROWSE,
          path: BROWSE,
          label: BROWSE,
        }
        processedFiles = [browseItem, ...processedFiles]
        allFiles = processedFiles
        filteredFiles = processedFiles
        break
      }
      default:
        break
    }
  }

  /**
   * delete job lists and jobs from [jobLists] recursively
   * @param jl jl to delete recursively from
   * @param confList files that were deleted
   */
  function recursiveDeleteJob(jl: jobList, confList: ConfToCreate[]) {
    jl.runs = jl.runs.filter(run => {
      return confList.find(cl => {
        return cl.confPath === run.confPath
      })
    })
    jl.children = jl.children.filter(child => {
      return child.children.length || child.runs.length
    })
    jl.children.forEach(child => {
      recursiveDeleteJob(child, confList)
    })
    jl.children = jl.children.filter(child => {
      return child.children.length || child.runs.length
    })
    return jl
  }

  /**
   * add lists and jobs to the filesystem structure
   * @param addedFiles files to add
   */
  function addLists(addedFiles: ConfToCreate[]) {
    addedFiles.forEach((file, index) => {
      const relativePath = file.confPath
        .replace(file.workspaceFolder, '')
        .split(CERTORA_CONF)[0]
      const pathArr = relativePath.split('/').filter(item => item)

      // create dir structure
      pathArr.forEach((item, index) => {
        let itemJobList: jobList = {
          runs: [],
          title: item,
          path: file.confPath.split(item)[0],
          namesMap: new Map(),
          children: [],
          isExpanded: true,
        }

        $jobLists = $jobLists.map(jl => {
          jl = recursivelyAddJobLists(itemJobList, jl, index, pathArr)
          return jl
        })
      })

      const fileName = getFileName(file.confPath)
      let curStatus = Status.missingSettings
      if (file.allowRun) {
        curStatus = Status.ready
      }

      const newRun: Run = {
        id: index,
        name: fileName,
        confPath: file.confPath,
        status: curStatus,
        showContextMenu: false,
        isExpanded: false,
      }

      $jobLists = $jobLists.map(jl => {
        jl = recursivelyAddJob(newRun, jl, pathArr[pathArr.length - 1])
        return jl
      })
    })
  }

  function recursivelyAddJobLists(
    childJL: jobList,
    parentJL: jobList,
    index: number,
    pathArr: string[],
  ) {
    if (
      !parentJL.children.find(child => {
        return child.title === childJL.title && child.path === childJL.path
      })
    ) {
      // either add to the JOB LIST (workspace folder) or to the directory that is before this one in the path
      if (index === 0 && parentJL.path === workspaceDirPath) {
        parentJL.children.push(childJL)
        parentJL.children = parentJL.children.sort((item1, item2) => {
          return item1.title > item2.title ? 1 : -1
        })
      } else if (
        parentJL.title === pathArr[index - 1] &&
        parentJL.path === childJL.path.split(pathArr[index - 1])[0]
      ) {
        parentJL.children.push(childJL)
        parentJL.children = parentJL.children.sort((item1, item2) => {
          return item1.title > item2.title ? 1 : -1
        })
      } else {
        parentJL.children.forEach(child => {
          recursivelyAddJobLists(childJL, child, index, pathArr)
        })
      }
    }
    return parentJL
  }

  /**
   * either add job to the job list that represents the directory the conf file of the job is in,
   * or add it to the workspace directory
   * @param newRun
   * @param jl
   * @param lastArrItem pathArr[pathArr.length - 1]
   */
  function recursivelyAddJob(newRun: Run, jl: jobList, lastArrItem: string) {
    if (
      jl.title === lastArrItem &&
      jl.path === newRun.confPath.split(lastArrItem)[0]
    ) {
      jl.runs.push(newRun)
      jl.namesMap.set(newRun.name, newRun.name.replaceAll('_', ' '))
      jl.runs = jl.runs.sort((item1, item2) => {
        return item1.confPath > item2.confPath ? 1 : -1
      })
    } else if (
      jl.title === JOB_LIST &&
      newRun.confPath.split(CERTORA_CONF)[0] === workspaceDirPath &&
      !jl.runs.find(r => {
        return r.confPath === newRun.confPath
      })
    ) {
      jl.runs.push(newRun)
      jl.namesMap.set(newRun.name, newRun.name.replaceAll('_', ' '))
      jl.runs = jl.runs.sort((item1, item2) => {
        return item1.confPath > item2.confPath ? 1 : -1
      })
    } else {
      //recursively look for job lists
      jl.children.forEach(child => {
        recursivelyAddJob(newRun, child, lastArrItem)
      })
    }
    return jl
  }

  /**
   * when the filesystem was change so we need to change the job structure
   * @param data new data
   */
  function changeJobs(data: ConfToCreate[]) {
    const confList: ConfToCreate[] = data.sort((item1, item2) => {
      return item1.confPath > item2.confPath ? 1 : -1
    })

    // handle deleted files
    $jobLists = $jobLists.map(jl => {
      return recursiveDeleteJob(jl, confList)
    })

    // handle added files
    let addedFiles = confList.filter(conf => {
      return recursivelyLookForConfFiles(conf, $jobLists[0])
    })

    addLists(addedFiles)
    getLastResults(addedFiles)
  }

  /**
   * return true if the conf doesn't exists in the job list filesystem (tree)
   * @param conf to search in the filesystem
   * @param jl root of the filesystem
   */
  function recursivelyLookForConfFiles(conf: ConfToCreate, jl: jobList) {
    const jlToSearch = [jl]
    while (jlToSearch.length) {
      let tempJL = jlToSearch.pop()
      if (
        tempJL.runs.find(run => {
          return run.confPath === conf.confPath
        })
      ) {
        return false
      }
      if (tempJL.children) {
        tempJL.children.forEach(child => {
          jlToSearch.push(child)
        })
      }
    }
    return true
  }

  function createInitialJobs(data: ConfToCreate[]) {
    const confList: ConfToCreate[] = data.sort((item1, item2) => {
      return item1.confPath > item2.confPath ? 1 : -1
    })

    const workspaceDirList: Run[] = confList
      .map((file, index) => {
        const fileName = getFileName(file.confPath)
        let curStatus = Status.missingSettings
        if (file.allowRun) {
          curStatus = Status.ready
        }
        const newRun: Run = {
          id: index,
          name: fileName,
          confPath: file.confPath,
          status: curStatus,
          showContextMenu: false,
          isExpanded: false,
        }
        if (file.confPath.split(CERTORA_CONF)[0] === file.workspaceFolder) {
          return newRun
        }
      })
      .filter(f => f)

    // create root job list
    const singleJobList: jobList = {
      runs: workspaceDirList,
      title: JOB_LIST,
      path: confList[0].workspaceFolder,
      namesMap: new Map(),
      children: [],
      isExpanded: true,
    }

    workspaceDirList.forEach(wdl => {
      singleJobList.namesMap.set(wdl.name, wdl.name.replaceAll('_', ' '))
    })

    $jobLists.push(singleJobList)

    addLists(confList)
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(): void {
    let path = JSON.parse(JSON.stringify($chosenFile))?.value || $chosenFile

    const confToCreate: ConfToCreate = {
      confPath: `${path}${CERTORA_CONF}.conf`.replace('//', '/'),
      allowRun: 0,
      workspaceFolder: workspaceDirPath,
    }
    createInitialJobs([confToCreate])
  }

  /**
   * run the first pending run in the queue
   */
  function runNext(): void {
    if (pendingQueue.length) {
      let curRun = pendingQueue.shift()
      pendingQueueCounter--
      $verificationResults = $verificationResults.filter(vr => {
        return vr.name !== curRun.confPath
      })
      runScript(curRun)
    }
  }

  /**
   * from conf file uri to only the file name
   */
  function getFileName(confFile: string): string {
    return confFile.split('/').pop().replace('.conf', '')
  }

  onMount(() => {
    window.addEventListener('message', listener)
    initResults()
    getDirs()
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })

  function resetHide() {
    $jobLists = $jobLists.map(jl => {
      jl = recursivelyHideMenu(jl)
      return jl
    })
  }

  function recursivelyHideMenu(jl: jobList) {
    jl.runs = jl.runs.map(run => {
      run.showContextMenu = false
      return run
    })
    jl.children = jl.children.map(child => {
      return recursivelyHideMenu(child)
    })
    return jl
  }

  window.onclick = function (event) {
    resetHide()
  }

  let infoObjArr = {
    infoText: 'Pick directory to start from',
    errorText:
      'Please choose a directory located inside the current open workspace',
  }

  function loadFilesFolder() {
    UploadDir(workspaceDirPath, false)
  }

  let filter = ''
  let disableButtons = writable(false)
  let allFiles = []
  let filteredFiles = []
  let isSolidityListOpen = false
  let solidityIconsObj = {
    selected: isSolidityListOpen,
    loadFilesFolder: loadFilesFolder,
    fileType: '',
    infoText: infoObjArr.infoText,
    errorText: infoObjArr.errorText,
    invalid: false,
  }
  let maxFiles = 15
  let filterCountObj = {
    allFiles: filteredFiles.length,
    filesShowing: maxFiles,
  }
  $: (filter || !filteredFiles.length) &&
    (filteredFiles = manageFiles(filter, filterCountObj, allFiles))
  function handleSelectSol(e) {
    if (e.detail.value === BROWSE) {
      loadFilesFolder()
      return
    }
    updateChosenFile(e.detail.value)
  }
  let chosenFile = writable('')

  $: workspaceDirPath && updateChosenFile(workspaceDirPath)

  function updateChosenFile(dir: string) {
    $chosenFile = dir
    if (!$chosenFile.startsWith(workspaceDirPath)) {
      solidityIconsObj.invalid = true
      $disableButtons = true
      return
    }
    $disableButtons = false
    solidityIconsObj.invalid = false
  }

  function handleClear(e) {
    updateChosenFile('')
  }
</script>

{#if !$jobLists.length}
  <div class="zero-state">
    <div class="command">
      <h3 class="command-description">Welcome To Certora Prover IDE</h3>
      <div class="command-description">Verify your smart contract</div>
    </div>
  </div>

  <div class="zero-state">
    <div class="command">
      <div class="command-description">Choose a directory</div>
      <div class="dark_input">
        <Select
          itemFilter={(label, filterText, option) => {
            return option
          }}
          bind:filterText={filter}
          items={filteredFiles}
          listOpen={isSolidityListOpen}
          iconProps={solidityIconsObj}
          Item={CustomItem}
          {Icon}
          {ClearIcon}
          on:select={handleSelectSol}
          on:clear={e => handleClear(e)}
          placeholder="Type to filter..."
          bind:value={$chosenFile}
          List={CustomList}
        />
      </div>
      <div style="margin-bottom:55px;" />
      <div class="command-description">Create your first job</div>
      <button
        class="command-button"
        disabled={$disableButtons}
        on:click={() => createRun()}
      >
        Create New Job
      </button>
      <div class="command-description">Or</div>
      <button
        class="command-button"
        disabled={$disableButtons}
        on:click={() =>
          uploadConf(
            JSON.parse(JSON.stringify($chosenFile)).value || $chosenFile,
          )}
      >
        Create New Job From Existing File
      </button>
    </div>
  </div>
{:else}
  <div
    on:contextmenu|stopPropagation|preventDefault={() => {
      resetHide()
    }}
  >
    <JobList
      {resetHide}
      bind:outputRunName
      bind:path={$jobLists[0].path}
      bind:title={$jobLists[0].title}
      bind:runs={$jobLists[0].runs}
      bind:namesMap={$jobLists[0].namesMap}
      bind:children={$jobLists[0].children}
      bind:isExpanded={$jobLists[0].isExpanded}
      bind:focusedRun={$focusedRun}
      bind:runningScripts
      bind:pendingQueue
      bind:output
    />
  </div>
{/if}
<ResultsOutput
  pathToCode={outputRunName.split(CERTORA_CONF)[0]}
  bind:output
  bind:selectedCalltraceFunction
/>

<style lang="postcss">
  :global(body) {
    padding: 0;
  }

  :global(:root) {
    --monospace-font: consolas, menlo, 'Courier New', monospace;
  }

  :global(body.vscode-light) {
    --code-item-name-color: #00f;
    --code-item-value-color: #454545;
    --code-item-value-background-color: #e4e6f1;
    --code-item-background-color-selected: #0060c0;
    --code-item-background-color-hover: #e4e6f1;
    --pane-border-color: rgb(97 97 97 / 19%);
  }

  :global(body.vscode-dark) {
    --code-item-name-color: #7cb9eb;
    --code-item-value-color: #ccc;
    --code-item-value-background-color: #37373d;
    --code-item-background-color-selected: #094771;
    --code-item-background-color-hover: #37373d;
    --pane-border-color: rgb(204 204 204 / 20%);
  }

  .zero-state {
    padding: 0 8px 0 20px;

    .command {
      margin-bottom: 27px;
    }

    .command-description {
      margin-bottom: 10px;
      line-height: 16px;
    }
    .command-button {
      width: 250px;
      height: 30px;
      margin-bottom: 10px;
      line-height: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: rgb(255, 255, 255);
      background-color: var(--vscode-button-background);
      box-sizing: border-box;
      border-style: solid;
      border-color: var(--vscode-button-background);
      border-radius: 2px;
      text-align: center;
      &:hover {
        background-color: var(--vscode-button-hoverBackground);
        border-color: var(--vscode-button-hoverBackground);
        cursor: pointer;
      }
      &:disabled {
        cursor: default;
        opacity: 65%;
        &:hover {
          background-color: var(--vscode-button-background);
          border-color: var(--vscode-button-background);
        }
      }
    }
    :global(.dark_input) {
      /* https://www.npmjs.com/package/svelte-select */
      /* https://github.com/rob-balfre/svelte-select/blob/master/docs/theming_variables.md */
      --background: var(--vscode-input-background);
      --borderRadius: 0;
      --borderFocusColor: var(--vscode-inputValidation-infoBorder);
      --borderHoverColor: var(--vscode-inputValidation-infoBorder);
      --border: 1px solid transparent;

      --selectedItemPadding: 0 10px 0 8px;
      /* from dev tools */
      --inputColor: var(--vscode-input-foreground);
      --placeholderColor: var(--vscode-input-placeholderForeground);
      --placeholderOpacity: 1;
      --height: 30px;
      --inputPadding: 6px 52px 6px 4px;
      --inputFontSize: 13px;
      --inputLetterSpacing: initial;
      --padding: 6px 4px;
      --internalPadding: 0;
      --inputLetterSpacing: inherit;
      /* drop down open */
      --listBackground: var(--vscode-editorSuggestWidget-background);
      --itemHoverBG: var(--vscode-editorSuggestWidget-border);
      --itemHoverColor: var(--vscode-editorSuggestWidget-foreground);
      --itemColor: var(--vscode-editorSuggestWidget-foreground);
      --listShadow: 0;
      --listBorderRadius: 0;
      --itemFirstBorderRadius: 0;
      --itemPadding: 0 2px 0 16px;

      --selectedItemPadding: 0;
      --listLeft: -2px;
      /* slected active */
      --itemIsActiveBG: var(--vscode-editorSuggestWidget-selectedBackground);
      --itemISActiveColor: var(--vscode-editorSuggestWidget-selectedForeground);
      /* close icon */
      --clearSelectRight: 52px;
      --clearSelectTop: 0;
      --clearSelectBottom: 0;
      --clearSelectWidth: 20px;
      --clearSelectFocusColor: var(--vscode-input-foreground);
      --inputColor: var(--vscode-input-foreground);
    }

    :global(.selectContainer) {
      gap: 24px;
    }
    :global(.selectContainer > input) {
      box-sizing: border-box;
    }

    :global(.dark_input .item) {
      position: relative;
      padding-left: 22px;
    }
    :global(.dark_input .item:before) {
      content: '\ea7b';
      font-family: 'codicon';
      position: absolute;
      top: 0;
      left: 2px;
    }

    :global(.dark_input .clearSelect) {
      display: flex !important;
    }

    /* error msg div */
    :global(.input_error_message) {
      background: var(--vscode-debugExceptionWidget-border);
      border: 1px solid var(--vscode-editorError-foreground);
      border-radius: 4px;
      padding: 6px 8px;
      margin-top: 8px;
      display: flex;
      font-size: 12px;
      font-weight: 500;
      line-height: 15px;
      position: absolute;
      width: -webkit-fill-available;
      z-index: 2;
    }

    :global(.input_error_message i) {
      margin: auto 8px auto 0;
    }
    :global(.input_error_message a) {
      margin-left: auto;
    }
  }
  /* global close icon */
  :global(.codicon-close, .codicon-info, .codicon-trash) {
    border-radius: 5px;
    padding: -5px;
  }
  :global(.codicon-close:hover, .codicon-info:hover, .codicon-trash:hover) {
    cursor: pointer;
    background-color: rgba(90, 93, 94, 0.31);
  }

  :global(button:hover, input:hover) {
    cursor: pointer;
  }
  :global(.vscode-high-contrast-light .dark_input) {
    --itemHoverColor: white !important;
  }
</style>
