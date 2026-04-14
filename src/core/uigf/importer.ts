import type { AccountData, WishRecord } from '../../model/types.js'
import { DEFAULT_TYPE_MAP } from '../../model/constants.js'
import { CliError } from '../../model/errors.js'
import { validateLocal, validateUigf30, validateUigf41 } from './schema.js'

const parseRank = (rank: string | number): number => Number.parseInt(String(rank), 10)

const ensureResultMap = (): Map<string, WishRecord[]> => {
  const result = new Map<string, WishRecord[]>()
  for (const key of DEFAULT_TYPE_MAP.keys()) result.set(key, [])
  return result
}

const fromUigf30 = (payload: any): AccountData => {
  const result = ensureResultMap()
  const list = [...payload.list].sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1))
  for (const item of list) {
    const pool = item.uigf_gacha_type
    if (!result.has(pool)) result.set(pool, [])
    result.get(pool)!.push([item.time, item.name, item.item_type, parseRank(item.rank_type), item.gacha_type, item.id])
  }
  return {
    uid: String(payload.info.uid),
    lang: payload.info.lang || 'en-us',
    time: Date.now(),
    typeMap: new Map(DEFAULT_TYPE_MAP),
    result
  }
}

const fromUigf41One = (accountPayload: any): AccountData => {
  const result = ensureResultMap()
  const list = [...accountPayload.list].sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1))
  for (const item of list) {
    const pool = item.uigf_gacha_type
    if (!result.has(pool)) result.set(pool, [])
    result.get(pool)!.push([item.time, item.name, item.item_type, parseRank(item.rank_type), item.gacha_type, item.id])
  }
  return {
    uid: String(accountPayload.uid),
    lang: accountPayload.lang || 'en-us',
    time: Date.now(),
    typeMap: new Map(DEFAULT_TYPE_MAP),
    result
  }
}

export const importAnyJson = (payload: any): AccountData[] => {
  if (validateLocal(payload)) {
    const local = payload as {
      uid: string
      lang: string
      time?: number
      typeMap: [string, string][]
      result: [string, WishRecord[]][]
    }
    return [
      {
        uid: local.uid,
        lang: local.lang,
        time: local.time || Date.now(),
        typeMap: new Map(local.typeMap),
        result: new Map(local.result)
      }
    ]
  }

  if (validateUigf30(payload)) {
    return [fromUigf30(payload)]
  }

  if (validateUigf41(payload)) {
    return (payload as { hk4e: any[] }).hk4e.map((x: any) => fromUigf41One(x))
  }

  throw new CliError('SCHEMA_INVALID', 'JSON does not match local/uigf schemas')
}
