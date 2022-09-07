/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { writable, Writable } from 'svelte/store'

// class MyFormStore {
//   // eslint-disable-next-line no-useless-constructor
//   constructor(
//     public solFilesArr: Writable<any[]> = writable([{value: 'stam', label: 'kishkush', path: 'balabush'}]),
//     public specFilesArr: Writable<any[]> = writable([]),
//     // eslint-disable-next-line @typescript-eslint/no-empty-function
//   ) {}

//   method(){}
// }

// Export a singleton
// export const myFormStore = new MyFormStore()

// Allow for multiple stores (good for contexts)
// export const createMyFormStore = () => new MyFormStore();

export const solFilesArr: Writable<any[]> = writable([
  { value: 'stam', label: 'kishkush', path: 'balabush' },
])
export const specFilesArr: Writable<any[]> = writable([])
