/* ---------------------------------------------------------------------------------------------
 *  Store all the writables. Every variable is saved here as soon as it is updated.
 *-------------------------------------------------------------------------------------------- */

import { Writable, writable } from 'svelte/store'
import type { jobList, Verification } from '../types'

export const CERTORA_CONF = '/certora/conf/'
export const JOB_LIST = 'JOB LIST'

export const verificationResults: Writable<Verification[]> = writable([])

export const jobLists: Writable<jobList[]> = writable([])
