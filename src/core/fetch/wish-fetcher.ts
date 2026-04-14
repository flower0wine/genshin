import { POOL_ORDER, DEFAULT_TYPE_MAP } from '../../model/constants.js'
import type { AccountData, FetchOutput, PoolKey, WishRecord } from '../../model/types.js'
import { CliError } from '../../model/errors.js'
import { requestJson, sleep } from './http.js'
import { mergeData } from '../merge/merge.js'

type ApiItem = {
  uid: string
  id: string
  gacha_type: string
  item_type: string
  rank_type: string
  name: string
  time: string
}

type ApiResponse = {
  retcode: number
  message: string
  data: {
    list: ApiItem[]
  }
}

const checkStatus = (res: ApiResponse): void => {
  if (res.retcode !== 0) {
    if (res.message === 'authkey timeout') {
      throw new CliError('AUTHKEY_TIMEOUT', 'Authkey timeout, open wish history and refresh URL')
    }
    throw new CliError('API_ERROR', `API error: ${res.message}`)
  }
}

const fetchPage = async (url: string, retry = 5): Promise<ApiItem[]> => {
  try {
    const res = await requestJson<ApiResponse>(url)
    checkStatus(res)
    return res.data.list || []
  } catch (e) {
    if (retry > 0) {
      await sleep(5000)
      return fetchPage(url, retry - 1)
    }
    throw e
  }
}

const fetchPool = async (
  apiDomain: string,
  query: URLSearchParams,
  pool: PoolKey,
  fetchFullHistory: boolean,
  localLatestId?: string
): Promise<{ uid: string; list: WishRecord[] }> => {
  let page = 1
  let endId = ''
  let uid = ''
  const list: ApiItem[] = []

  while (true) {
    const qs = new URLSearchParams(query)
    qs.set('gacha_type', pool)
    qs.set('page', String(page))
    qs.set('size', '20')
    if (endId) qs.set('end_id', endId)

    const url = `${apiDomain}/gacha_info/api/getGachaLog?${qs.toString()}`
    const pageList = await fetchPage(url)

    if (!pageList.length) break
    if (!uid) uid = pageList[0].uid

    list.push(...pageList)
    endId = pageList[pageList.length - 1].id

    if (!fetchFullHistory && localLatestId && pageList.some((x) => x.id === localLatestId)) {
      break
    }

    page += 1
    await sleep(300)
    if (page % 10 === 0) await sleep(1000)
  }

  const normalized: WishRecord[] = list
    .map((x) => [x.time, x.name, x.item_type, parseInt(x.rank_type, 10), x.gacha_type, x.id])
    .reverse() as WishRecord[]

  return { uid, list: normalized }
}

const preflight = async (apiDomain: string, query: URLSearchParams): Promise<void> => {
  const url = `${apiDomain}/gacha_info/api/getConfigList?${query.toString()}`
  const res = await requestJson<ApiResponse>(url)
  checkStatus(res)
}

const tryGetUid = async (apiDomain: string, query: URLSearchParams): Promise<string> => {
  for (const pool of POOL_ORDER) {
    const qs = new URLSearchParams(query)
    qs.set('gacha_type', pool)
    qs.set('page', '1')
    qs.set('size', '6')
    const url = `${apiDomain}/gacha_info/api/getGachaLog?${qs.toString()}`
    try {
      const res = await requestJson<ApiResponse>(url)
      checkStatus(res)
      if (res.data.list?.length) return res.data.list[0].uid
    } catch {
      // continue
    }
  }
  return ''
}

export const fetchAccount = async (
  apiDomain: string,
  query: URLSearchParams,
  local?: AccountData,
  fetchFullHistory = false
): Promise<{ account: AccountData; output: FetchOutput }> => {
  await preflight(apiDomain, query)

  const guessedUid = await tryGetUid(apiDomain, query)
  const lang = query.get('lang') || local?.lang || 'en-us'

  const result = new Map<string, WishRecord[]>()
  const typeMap = new Map(DEFAULT_TYPE_MAP)
  let originUid = guessedUid

  for (const pool of POOL_ORDER) {
    const localLatestId = local?.result.get(pool)?.at(-1)?.[5]
    const { uid, list } = await fetchPool(apiDomain, query, pool, fetchFullHistory, localLatestId)
    if (!originUid && uid) originUid = uid
    result.set(pool, list)
  }

  if (!originUid) {
    throw new CliError('API_ERROR', 'Cannot determine uid from fetched data')
  }

  const incoming: AccountData = {
    uid: originUid,
    lang,
    time: Date.now(),
    typeMap,
    result
  }

  const mergedResult = mergeData(local, incoming)
  const account: AccountData = { ...incoming, result: mergedResult }

  let totalCount = 0
  let oldTotal = 0
  for (const [, arr] of account.result) totalCount += arr.length
  if (local) {
    for (const [, arr] of local.result) oldTotal += arr.length
  }

  return {
    account,
    output: {
      uid: account.uid,
      lang: account.lang,
      pools: Object.fromEntries([...account.result].map(([k, v]) => [k, v.length])),
      addedCount: Math.max(0, totalCount - oldTotal),
      totalCount,
      updatedAt: account.time
    }
  }
}
