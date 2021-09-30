export type TreeItem = {
  name: string
  childrenList: TreeItem[]
}

export type Tree = TreeItem[]

export type Action = { title: string; onClick: () => void; icon: string }
