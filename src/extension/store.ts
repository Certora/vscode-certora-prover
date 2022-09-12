import { derived, writable, Writable } from 'svelte/store'

class MyFormStore {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public firstname: Writable<string> = writable(''),
    public lastname: Writable<string> = writable(''),
  ) {}

  get fullname() {
    // Use derived to access writable values and export as readonly
    return derived(
      [this.firstname, this.lastname],
      ([$firstName, $lastName]) => {
        return $firstName + ' ' + $lastName
      },
    )
  }
}

// Export a singleton
export const myFormStore = new MyFormStore()
