import type { AccountData, WishRecord } from '../../model/types.js'

const compareList = (b: WishRecord[], a: WishRecord[]): boolean => {
  if (!b.length) return false
  let compareA = a
  if (b.length < compareA.length) compareA = compareA.slice(0, b.length)
  const strA = compareA.map((item) => item.slice(0, 4).join('-')).join(',')
  const strB = b.map((item) => item.slice(0, 4).join('-')).join(',')
  return strA === strB
}

export const mergeList = (incoming: WishRecord[], local: WishRecord[]): WishRecord[] => {
  if (!incoming?.length) return local || []
  if (!local?.length) return incoming

  const minIncoming = new Date(incoming[0][0]).getTime()
  const idIncoming = incoming[0][5]

  let pos = local.length
  let idFound = false

  for (let i = local.length - 1; i >= 0; i -= 1) {
    const idLocal = local[i][5]
    if (idLocal && idLocal === idIncoming) {
      pos = i
      idFound = true
      break
    }
  }

  if (!idFound) {
    const width = Math.min(11, incoming.length, local.length)
    for (let i = 0; i < local.length; i += 1) {
      const time = new Date(local[i][0]).getTime()
      if (time >= minIncoming) {
        if (compareList(local.slice(i, width + i), incoming.slice(0, width))) {
          pos = i
          break
        }
      }
    }
  }

  return local.slice(0, pos).concat(incoming)
}

export const mergeData = (local: AccountData | undefined, incoming: AccountData): Map<string, WishRecord[]> => {
  if (!local) return incoming.result
  if (local.uid !== incoming.uid) return incoming.result

  const merged = new Map<string, WishRecord[]>()
  for (const [key, list] of incoming.result) {
    merged.set(key, mergeList(list, local.result.get(key) || []))
  }
  return merged
}
