import type { AccountData, WishRecord } from '../../model/types.js'

export const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

export const timezoneFromUid = (uid: string): number => {
  if (uid.startsWith('6')) return -5
  if (uid.startsWith('7')) return 1
  return 8
}

export const fakeIdGenerator = (): (() => string) => {
  let id = 1000000000000000000n
  return () => {
    id += 1n
    return id.toString()
  }
}

export const sortById = <T extends { id: string }>(arr: T[]): T[] => {
  return arr.sort((a, b) => {
    const x = BigInt(a.id)
    const y = BigInt(b.id)
    return x < y ? -1 : x > y ? 1 : 0
  })
}

export const flattenAccountRecords = (account: AccountData): Array<{ uigf_gacha_type: string; rec: WishRecord }> => {
  const out: Array<{ uigf_gacha_type: string; rec: WishRecord }> = []
  for (const [pool, list] of account.result) {
    for (const rec of list) out.push({ uigf_gacha_type: pool, rec })
  }
  return out
}
