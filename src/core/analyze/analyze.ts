import type { WishRecord } from '../../model/types.js'

export type PoolSummary = {
  pool: string
  total: number
  count3: number
  count4: number
  count5: number
  ssrPos: Array<{ name: string; pity: number; time: string; gachaType: string }>
}

export const analyzePool = (pool: string, records: WishRecord[]): PoolSummary => {
  let count3 = 0
  let count4 = 0
  let count5 = 0
  let lastSSR = 0
  const ssrPos: Array<{ name: string; pity: number; time: string; gachaType: string }> = []

  records.forEach((item, index) => {
    const [time, name, , rank, gachaType] = item
    if (rank === 3) count3 += 1
    else if (rank === 4) count4 += 1
    else if (rank === 5) {
      count5 += 1
      ssrPos.push({ name, pity: index + 1 - lastSSR, time, gachaType })
      lastSSR = index + 1
    }
  })

  return { pool, total: records.length, count3, count4, count5, ssrPos }
}

export const analyzeAll = (result: Map<string, WishRecord[]>, pools?: string[]): PoolSummary[] => {
  const selected = pools?.length ? new Set(pools) : null
  const out: PoolSummary[] = []
  for (const [pool, records] of result) {
    if (selected && !selected.has(pool)) continue
    out.push(analyzePool(pool, records))
  }
  return out
}
