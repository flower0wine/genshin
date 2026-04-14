export type WishRecord = [
  time: string,
  name: string,
  itemType: string,
  rank: number,
  gachaType: string,
  id: string
]

export type PoolKey = '100' | '200' | '301' | '302' | '500'

export const POOL_ORDER: PoolKey[] = ['301', '302', '200', '500', '100']

export type AccountData = {
  uid: string
  lang: string
  time: number
  typeMap: Map<string, string>
  result: Map<string, WishRecord[]>
}

export type StoredAccountData = {
  uid: string
  lang: string
  time: number
  typeMap: [string, string][]
  result: [string, WishRecord[]][]
}

export type FetchInput = {
  url?: string
  auto?: boolean
  fetchFullHistory?: boolean
}

export type FetchOutput = {
  uid: string
  lang: string
  pools: Record<string, number>
  addedCount: number
  totalCount: number
  updatedAt: number
}
