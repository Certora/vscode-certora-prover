<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Main file of the Results part of the extension.
   *  creates runs under MY RUNS pane, creates action buttons, sends actions
   *  like edit, run etc.
   *-------------------------------------------------------------------------------------------- */

  import { onMount, onDestroy } from 'svelte'
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import ContractCallResolution from './components/ContractCallResolution.svelte'
  import {
    runScript,
    stopScript,
    openSettings,
    getOutput,
    editConfFile,
    deleteConf,
    duplicate,
    removeScript,
    askToDeleteJob,
    initResults,
    uploadConf,
    enableEdit,
    rename,
  } from './extension-actions'
  import { smartMergeVerificationResult } from './utils/mergeResults'
  import { log, Sources } from './utils/log'
  import {
    Assert,
    Output,
    EventsFromExtension,
    Rule,
    Verification,
    Run,
    JobNameMap,
    Status,
    CONF_DIRECTORY,
    jobList,
    ConfToCreate,
  } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'

  import { writable } from 'svelte/store'
  import {
    expandables,
    // expandCollapse,
    jobLists,
    verificationResults,
  } from './store/store'
  import JobList from './components/JobList.svelte'

  // export const hide = writable([])
  export const pos = writable({ x: 0, y: 0 })
  export const focusedRun = writable('')

  let output: Output
  let outputRunName: string
  let selectedCalltraceFunction: CallTraceFunction

  let runningScripts: { pid: number; confFile: string; uploaded: boolean }[] =
    []
  let pendingQueue: JobNameMap[] = []
  let pendingQueueCounter = 0

  function selectCalltraceFunction(e: CustomEvent<CallTraceFunction>) {
    selectedCalltraceFunction = e.detail
  }

  function clearOutput() {
    if (output) output = undefined
    if (selectedCalltraceFunction) selectedCalltraceFunction = undefined
  }

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
          output.runName = outputRunName
        }
        break
      }
      case EventTypesFromExtension.ClearAllJobs: {
        log({
          action: 'Received "clear-all-jobs" command',
          source: Sources.ResultsWebview,
          info: {
            current$verificationResults: $verificationResults,
          },
        })
        if ($verificationResults.length) $verificationResults = []
        clearOutput()
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
        if ($jobLists.length) return

        createInitialJobs(e.data.payload)
        break
      }
      case EventTypesFromExtension.newJob: {
        log({
          action: 'Received "new-job" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // when we get the last results we don't want to create new job items
        const newJobToCreate = e.data.payload
        const pathArr = newJobToCreate.confPath
          .replace(newJobToCreate.workspaceFolder, '')
          .split('/')
          .filter(f => f)
          .reverse()
        let curPath = newJobToCreate.workspaceFolder + '/' + pathArr.pop()
        let curJobList = $jobLists[0]
        $jobLists.forEach((jl, index) => {
          console.log(jl.path + jl.title, curPath)
          if (jl.path + jl.title === curPath) {
            curPath += '/' + pathArr.pop()
            curJobList = jl
          }
        })
        console.log(curJobList, curPath, 'coming from new-job')

        let curStatus: Status = newJobToCreate.allowRun
          ? Status.ready
          : Status.missingSettings
        const newRunName = newJobToCreate.confPath
          .split('/certora/conf/')[1]
          .replace('.conf', '')
        const newRun: Run = {
          id: curJobList.runs.length,
          name: newRunName,
          confPath: newJobToCreate.confPath,
          status: curStatus,
          showContextMenu: false,
          isExpanded: false,
        }
        curJobList.runs.push(newRun)
        curJobList.namesMap.set(newRun.name, newRun.name.replaceAll('_', ' '))
        $jobLists = $jobLists
        break
      }
      default:
        break
    }
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
        if (file.confPath.split('/certora/conf/')[0] === file.workspaceFolder) {
          return newRun
        }
      })
      .filter(f => f)

    console.log('workspace files', workspaceDirList)

    const singleJobList: jobList = {
      runs: workspaceDirList,
      title: 'JOB LIST',
      path: confList[0].workspaceFolder,
      namesMap: new Map(),
      children: [],
      isExpanded: true,
      activateExpandCollapse: false,
    }
    console.log(confList)

    workspaceDirList.forEach(wdl => {
      singleJobList.namesMap.set(wdl.name, wdl.name.replaceAll('_', ' '))
    })

    $jobLists.push(singleJobList)

    confList.forEach((file, index) => {
      const relativePath = file.confPath
        .replace(file.workspaceFolder, '')
        .split('certora/conf')[0]
      const pathArr = relativePath.split('/').filter(item => item)

      // create dir structure
      pathArr.forEach((item, index) => {
        const itemJobList: jobList = {
          runs: [],
          title: item,
          path: file.confPath.split(item)[0],
          namesMap: new Map(),
          children: [],
          isExpanded: true,
          activateExpandCollapse: false,
        }
        $jobLists = $jobLists.map(jl => {
          if (
            !jl.children.find(child => {
              return child.title === item && child.path === itemJobList.path
            })
          ) {
            // either add to the JOB LIST (workspace folder) or to the directory that is before this one in the path
            if (index === 0 && jl.path === confList[0].workspaceFolder) {
              jl.children.push(itemJobList)
            } else if (
              jl.title === pathArr[index - 1] &&
              jl.path === itemJobList.path.split(pathArr[index - 1])[0]
            ) {
              jl.children.push(itemJobList)
            }
          }
          return jl
        })
        // add to the job list (todo: delete this?)
        if (
          !$jobLists.find(jobList => {
            return jobList.title === item && jobList.path === itemJobList.path
          })
        ) {
          console.log(itemJobList, 'add outside condition')
          $jobLists.push(itemJobList)
        }
      })

      console.log('job list after arr foreach', $jobLists)

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
        if (
          jl.title === pathArr[pathArr.length - 1] &&
          jl.path === file.confPath.split(pathArr[pathArr.length - 1])[0]
        ) {
          jl.runs.push(newRun)
          jl.namesMap.set(newRun.name, newRun.name.replaceAll('_', ' '))
        }
        return jl
      })
    })
    console.log('JOB LISTS', $jobLists)
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(run?: Run): void {
    // todo: create new job list with a new run from scratch
  }

  /**
   * run the first pending run in the queue
   */
  function runNext(): void {
    if (pendingQueue.length) {
      let curRun = pendingQueue.shift()
      pendingQueueCounter--
      $verificationResults = $verificationResults.filter(vr => {
        return vr.name !== getFileName(curRun.confPath)
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
    // $expandables.push({
    //   title: 'JOB LIST',
    //   isExpanded: true,
    //   tree: [],
    // })
    // if (!runs.length) {
    initResults()
    // }
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })

  function resetHide() {
    $jobLists = $jobLists.map(jl => {
      jl.runs = jl.runs.map(run => {
        run.showContextMenu = false
        return run
      })
      return jl
    })
  }

  window.onclick = function (event) {
    resetHide()
    console.log('click on webview')
  }
</script>

{#if $jobLists.length === 0}
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
  <div>
    <JobList
      {resetHide}
      bind:path={$jobLists[0].path}
      bind:title={$jobLists[0].title}
      bind:runs={$jobLists[0].runs}
      bind:namesMap={$jobLists[0].namesMap}
      bind:children={$jobLists[0].children}
      bind:activateExpandCollapse={$jobLists[0].activateExpandCollapse}
      bind:isExpanded={$jobLists[0].isExpanded}
      bind:focusedRun={$focusedRun}
      bind:output
      bind:runningScripts
      bind:pendingQueue
    />
  </div>
{/if}
<!-- todo: handle output -->
{#if output}
  {#if output.variables && output.variables.length}
    <Pane
      title={`${output.treeViewPath.ruleName} variables`}
      actions={[
        {
          title: 'Close Output',
          icon: 'close',
          onClick: clearOutput,
        },
      ]}
    >
      <CodeItemList codeItems={output.variables} />
    </Pane>
  {/if}
  {#if output.callTrace && Object.keys(output.callTrace).length}
    <Pane title={`CALL TRACE`}>
      <Tree
        runDisplayName=""
        data={{
          type: TreeType.Calltrace,
          tree: [output.callTrace],
        }}
        on:selectCalltraceFunction={selectCalltraceFunction}
      />
    </Pane>
  {/if}
  {#if selectedCalltraceFunction && selectedCalltraceFunction.variables && selectedCalltraceFunction.variables.length}
    <Pane title={`${selectedCalltraceFunction.name} variables`}>
      <CodeItemList codeItems={selectedCalltraceFunction.variables} />
    </Pane>
  {/if}
  {#if output.callResolutionWarnings && output.callResolutionWarnings.length}
    <Pane title={`Contract call resolution warnings`}>
      {#each output.callResolutionWarnings as resolution}
        <ContractCallResolution contractCallResolution={resolution} />
      {/each}
    </Pane>
  {/if}
  {#if output.callResolution && output.callResolution.length}
    <Pane title={`Contract call resolution`}>
      {#each output.callResolution as resolution}
        <ContractCallResolution contractCallResolution={resolution} />
      {/each}
    </Pane>
  {/if}
{/if}

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
