/* ---------------------------------------------------------------------------------------------
 *  Resend all the solidity / spec files from the workspace folder.
 *-------------------------------------------------------------------------------------------- */

// sort function
function sortByAbc(
  sortedfiles: { value: string; label: string; path: string }[],
): { value: string; label: string; path: string }[] {
  const sorted = sortedfiles.sort((f1, f2) => {
    return alphaSort(f1, f2)
  })
  return sorted
}
function alphaSort(l1, l2): number {
  if (l1.label.toLowerCase() > l2.label.toLowerCase()) {
    return 1
  }
  if (l2.label.toLowerCase() > l1.label.toLowerCase()) {
    return -1
  }
  if (l1.path.toLowerCase() > l2.path.toLowerCase()) {
    return 1
  }
  if (l2.path.toLowerCase() > l1.path.toLowerCase()) {
    return -1
  }
  return 0
}

// resets the input files array and the count object
function resetFiles(
  maxFiles: number,
  filesArr: { value: string; label: string; path: string }[],
): { value: string; label: string; path: string }[] {
  const filterCountObj = {
    allFiles: filesArr.length,
    filesShowing: maxFiles,
  }
  const slicedArr = filesArr.slice(0, filterCountObj.filesShowing)
  const sortedFiles = sortByAbc(slicedArr)
  const filteredFiles = [
    {
      value: 'Browse...',
      label: 'Browse...',
      path: `Showing ${slicedArr.length}/${filterCountObj.allFiles} files`,
    },
    ...sortedFiles,
  ]
  return filteredFiles
}

export function manageFiles(
  filter: string,
  filterCountObj: { allFiles: number; filesShowing: number },
  filesArr: { value: string; label: string; path: string }[],
): { value: string; label: string; path: string }[] {
  // on app load filter changes to '' and reset is called
  // and when it actually is an ''
  if (filter === '') {
    const filteredFiles = resetFiles(filterCountObj.filesShowing, filesArr)
    return filteredFiles
  }
  // filter all the files
  const newFilteredFiles = filesArr.filter(file => {
    return file.label.toLowerCase().includes(filter.toLowerCase())
  })
  // if no matches found return an empty array to display a message
  if (!newFilteredFiles.length) return []
  // if the amount of the filtered files is bigger than display limit slice and dice the array
  if (newFilteredFiles.length > filterCountObj.filesShowing) {
    const sortedFiles = sortByAbc(
      newFilteredFiles.slice(0, filterCountObj.filesShowing),
    )
    const filteredFiles = [
      {
        value: 'Browse...',
        label: 'Browse...',
        path: `Showing ${filterCountObj.filesShowing}/${newFilteredFiles.length} files`,
      },
      ...sortedFiles,
    ]
    return filteredFiles
  }
  // amount of the filtered files is smaller or same as limit
  const sortedFiles = sortByAbc(newFilteredFiles)
  const filteredFiles = [
    {
      value: 'Browse...',
      label: 'Browse...',
      path: `Showing ${newFilteredFiles.length}/${newFilteredFiles.length} files`,
    },
    ...sortedFiles,
  ]
  return filteredFiles
}
