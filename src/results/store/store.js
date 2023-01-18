/* ---------------------------------------------------------------------------------------------
 *  Store all the writables. Every variable is saved here as soon as it is updated.
 *-------------------------------------------------------------------------------------------- */

import { writable } from 'svelte/store'

export const expendables = writable([])
