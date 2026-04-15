import { POOL_ORDER, type WishRecord } from '../../model/types.js'

export type FiveStarDrop = {
  id: string
  name: string
  time: string
  itemType: string
  pity: number
  pool: string
}

export type PoolProfile = {
  pool: string
  totalPulls: number
  fiveStarCount: number
  avgPity: number | null
  currentPity: number
  fiveStars: FiveStarDrop[]
}

export type GachaProfile = {
  generatedAt: number
  totalPulls: number
  totalFiveStars: number
  avgPity: number | null
  estimatedPrimogems: number
  luckTier: string
  tags: string[]
  pools: PoolProfile[]
}

const round1 = (n: number): number => Math.round(n * 10) / 10

const avgOrNull = (list: number[]): number | null => {
  if (!list.length) return null
  const sum = list.reduce((a, b) => a + b, 0)
  return round1(sum / list.length)
}

const resolveLuckTier = (avgPity: number | null): string => {
  if (avgPity === null) return '未出金'
  if (avgPity <= 35) return '天运所归'
  if (avgPity <= 45) return '终极欧皇'
  if (avgPity <= 55) return '大欧皇'
  if (avgPity <= 65) return '小欧皇'
  if (avgPity <= 72) return '小有运气'
  if (avgPity <= 78) return '平民'
  if (avgPity <= 84) return '小非酋'
  if (avgPity <= 90) return '大非酋'
  return '终极非酋'
}

const resolveTags = (pools: PoolProfile[], avgPity: number | null, totalFiveStars: number): string[] => {
  const tags: string[] = []
  const characterPool = pools.find((x) => x.pool === '301')
  const weaponPool = pools.find((x) => x.pool === '302')

  if (totalFiveStars === 0) tags.push('未出金')
  if (avgPity !== null && avgPity >= 70) tags.push('常吃保底')
  if (characterPool && characterPool.currentPity > 0) tags.push(`角色池已垫${characterPool.currentPity}抽`)
  if (weaponPool && weaponPool.currentPity > 0) tags.push(`武器池已垫${weaponPool.currentPity}抽`)

  return tags
}

const analyzeOnePool = (pool: string, records: WishRecord[]): PoolProfile => {
  let lastFiveIndex = -1
  const pityList: number[] = []
  const fiveStars: FiveStarDrop[] = []

  records.forEach((item, idx) => {
    const [time, name, itemType, rank, , id] = item
    if (rank !== 5) return
    const pity = idx + 1 - lastFiveIndex - 1
    pityList.push(pity)
    fiveStars.push({ id, name, time, itemType, pity, pool })
    lastFiveIndex = idx
  })

  const currentPity = records.length - (lastFiveIndex + 1)

  return {
    pool,
    totalPulls: records.length,
    fiveStarCount: fiveStars.length,
    avgPity: avgOrNull(pityList),
    currentPity,
    fiveStars
  }
}

const sortPools = (pools: string[]): string[] => {
  const known = POOL_ORDER.filter((x) => pools.includes(x))
  const unknown = pools.filter((x) => !POOL_ORDER.includes(x as any)).sort()
  return [...known, ...unknown]
}

export const buildGachaProfile = (result: Map<string, WishRecord[]>, selectedPools?: string[]): GachaProfile => {
  const selected = selectedPools?.length ? new Set(selectedPools) : null
  const poolKeys = [...result.keys()].filter((k) => !selected || selected.has(k))
  const orderedPoolKeys = sortPools(poolKeys)

  const pools = orderedPoolKeys.map((pool) => analyzeOnePool(pool, result.get(pool) || []))
  const allPity = pools.flatMap((p) => p.fiveStars.map((x) => x.pity))
  const totalPulls = pools.reduce((sum, p) => sum + p.totalPulls, 0)
  const totalFiveStars = pools.reduce((sum, p) => sum + p.fiveStarCount, 0)
  const avgPity = avgOrNull(allPity)

  return {
    generatedAt: Date.now(),
    totalPulls,
    totalFiveStars,
    avgPity,
    estimatedPrimogems: totalPulls * 160,
    luckTier: resolveLuckTier(avgPity),
    tags: resolveTags(pools, avgPity, totalFiveStars),
    pools
  }
}
