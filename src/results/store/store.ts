/* ---------------------------------------------------------------------------------------------
 *  Store all the writables. Every variable is saved here as soon as it is updated.
 *-------------------------------------------------------------------------------------------- */

import { Writable, writable } from 'svelte/store'
import type { Verification } from '../types'

export const expandables = writable([])
export const expandCollapse = writable({
  title: 'Expand All',
  icon: 'expand-all',
  var: true,
  hasResults: false,
})
export const verificationResults: Writable<Verification[]> = writable([])
