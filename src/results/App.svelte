<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Main file of the Results part of the extension.
   *  creates runs under MY RUNS pane, creates action buttons, sends actions
   *  like edit, run etc.
   *-------------------------------------------------------------------------------------------- */

  import { onMount, onDestroy } from 'svelte'
  import {
    runScript,
    initResults,
    uploadConf,
    getLastResults,
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

  import { writable } from 'svelte/store'
  import {
    CERTORA_CONF,
    JOB_LIST,
    jobLists,
    verificationResults,
  } from './store/store'
  import JobList from './components/JobList.svelte'
  import ResultsOutput from './components/ResultsOutput.svelte'

  export const focusedRun = writable('')

  export let outputRunName: string = ''

  let output: Output
  // let outputRunName: string
  let selectedCalltraceFunction: CallTraceFunction

  let runningScripts: { pid: number; confFile: string; uploaded: boolean }[] =
    []
  let pendingQueue: JobNameMap[] = []
  let pendingQueueCounter = 0

  let workspaceDirPath

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

    $jobLists = $jobLists.filter(jl => {
      return jl.children.length || jl.runs.length
    })
    console.log('missing files', $jobLists)

    // handle added files
    let addedFiles = confList.filter(conf => {
      return recursivelyLookForConfFiles(conf, $jobLists[0])
    })
    console.log(addedFiles, 'added files', $jobLists)

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

    console.log('workspace files', workspaceDirList)

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

    console.log('JOB LISTS', $jobLists)
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(): void {
    const newRun: Run = {
      id: 0,
      name: '',
      confPath: '',
      status: Status.missingSettings,
      showContextMenu: false,
      isExpanded: false,
    }
    const singleJobList: jobList = {
      runs: [newRun],
      title: JOB_LIST,
      path: workspaceDirPath,
      namesMap: new Map(),
      children: [],
      isExpanded: true,
    }
    $jobLists.push(singleJobList)
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
    console.log('app updated')
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
    console.log('click on webview')
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
      <div class="command-description">Create your first job</div>
      <vscode-button class="command-button" on:click={() => createRun()}>
        Configure New Job
      </vscode-button>
      <div class="command-description">Or</div>
      <vscode-button class="command-button" on:click={() => uploadConf('')}>
        Upload Configuration File
      </vscode-button>
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
      width: 230px;
      height: 30px;
      margin-bottom: 10px;
      line-height: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
