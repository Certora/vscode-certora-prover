import type { Assert, Job, Rule, Tree, Verification } from '../types'

export function mergeResults(results: Job[], newResult: Job): void {
  const index = results.findIndex(
    item =>
      item.jobId === newResult.jobId ||
      item.verificationProgress.contract ===
        newResult.verificationProgress.contract,
  )

  if (index > -1) {
    results[index] = newResult
  } else {
    results.push(newResult)
  }
}

function addJobIdToAsserts(jobId: string, asserts: Assert[]) {
  asserts.forEach(assert => {
    assert.jobId = jobId
  })
}

function addJobIdToRules(jobId: string, rules: Rule[]) {
  rules.forEach(rule => {
    rule.jobId = jobId
    addJobIdToAsserts(jobId, rule.asserts)
    if (rule.children != null && rule.children.length > 0) {
      addJobIdToRules(jobId, rule.children)
    }
  })
}

function addJobIdToProperties(job: Job) {
  const tree: Tree = job.verificationProgress
  const jobId: string = job.jobId
  addJobIdToRules(jobId, tree.rules)
}

export function smartMergeVerificationResult(
  results: Verification[],
  newResult: Job,
): void {
  const tree: Tree = newResult.verificationProgress
  // look for Verification with the same contract name and spec file
  const index = results.findIndex(
    item => item.contract === tree.contract || item.spec === tree.spec,
  )
  // if found
  if (index > -1) {
    console.log(
      'found Verification with contract=' +
        tree.contract +
        ' spec=' +
        tree.spec,
    )
    console.log(results[index])
    mergeVerification(results[index], newResult)
  } else {
    addJobIdToProperties(newResult)
    console.log(newResult)
    // create a new Verification object and push to the Verification[]
    const newVerification: Verification = {
      contract: tree.contract,
      spec: tree.spec,
      jobs: [newResult],
    }
    results.push(newVerification)
  }
}

function mergeVerification(prevResult: Verification, newJob: Job): void {
  console.log('mergeVerification')
  console.log(newJob.jobId)
  const prevJobs: Job[] = prevResult.jobs
  // Look for the same jobId
  const index = prevJobs.findIndex(job => job.jobId === newJob.jobId)
  // if found
  if (index > -1) {
    console.log('Found the same job id')
    const prevJob: Job = prevJobs[index]

    const prevTree: Tree = prevJob.verificationProgress
    const newTree: Tree = newJob.verificationProgress
    console.log('comparing the timestamps')
    console.log('prev=' + prevTree.timestamp + ' new=' + newTree.timestamp)
    // take the most recent result
    if (prevTree.timestamp <= newTree.timestamp) {
      console.log('prev is smaller')
      // TODO: check if we need to check equaility because
      // sometimes two different results can have the same timestamp
      prevJobs[index] = newJob
    } else {
      console.log('prev is bigger')
    }
  } else {
    // take the most recent result (based on creation time)
    // simply overriding the Rule[] is not enough
    // we may (mistakenly) override previous results
    // for example, in job A we verifiy rule A
    // and in job B we verify rule B
    // Thus, we should present both rule A and rule B in the final result
    smartRulesMerge(prevJobs, newJob)
  }
}

async function smartRulesMerge(prevJobs: Job[], newJob: Job): Promise<void> {
  console.log('smartRulesMerge')
  // traverse the Job[] and look for the same Rule
  // if found choose the one with the most recent creation time
  // the other should be removed from the Rule[] of the associated Tree object
  const newTree: Tree = newJob.verificationProgress
  const newRules: Rule[] = newTree.rules
  prevJobs.forEach(prevJob => {
    const prevTree: Tree = prevJob.verificationProgress
    const prevRules: Rule[] = prevTree.rules
    // intersection
    const commonRules = newRules.filter(rule =>
      prevRules.some(({ name }) => rule.name === name),
    )
    if (commonRules.length > 0) {
      console.log('commonRules length is ' + commonRules.length)
      compareRulesCreationTime(commonRules, prevJob, newJob)
    }
  })
  addJobIdToProperties(newJob)
  prevJobs.push(newJob)
  removeEmptyJobs(prevJobs)
}

async function compareRulesCreationTime(
  commonRules: Rule[],
  prevJob: Job,
  newJob: Job,
) {
  console.log('compareRulesCreationTime')
  if (commonRules.length > 0) {
    try {
      console.log('compareRulesCreationTime')
      const prevPostTime = prevJob.creationTime
      const newPostTime = newJob.creationTime
      console.log(
        'prevPostTime=' + prevPostTime + ', newPostTime=' + newPostTime,
      )
      const commonRulesNames: string[] = commonRules.map(rule => rule.name)
      if (prevPostTime <= newPostTime) {
        removeOutdatedRules(commonRulesNames, prevJob)
      } else {
        // prevPostTime > newPostTime
        removeOutdatedRules(commonRulesNames, newJob)
      }
    } catch (e) {
      console.log(e)
    }
  }
}

function removeOutdatedRules(commonRulesNames: string[], job: Job) {
  console.log('removeOutdatedRules')
  const rules: Rule[] = job.verificationProgress.rules
  for (let i = rules.length - 1; i >= 0; i--) {
    if (rules[i].name in commonRulesNames) {
      console.log('removeOutdatedRules')
      console.log(rules[i].name)
      rules.splice(i, 1)
    }
  }
}

function removeEmptyJobs(jobs: Job[]) {
  console.log('removeEmptyJobs')
  for (let i = jobs.length - 1; i >= 0; i--) {
    const tree: Tree = jobs[i].verificationProgress
    const rules = tree.rules
    if (rules.length === 0) {
      console.log(jobs[i].jobId)
      jobs.splice(i, 1)
    }
  }
}
