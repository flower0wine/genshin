import { describe, expect, it } from 'vitest'
import type { WishRecord } from '../../model/types.js'
import { buildGachaProfile } from './profile.js'

const mk = (
  time: string,
  name: string,
  itemType: string,
  rank: number,
  gachaType: string,
  id: string
): WishRecord => [time, name, itemType, rank, gachaType, id]

describe('buildGachaProfile', () => {
  it('computes pity and overall profile metrics', () => {
    const result = new Map<string, WishRecord[]>([
      [
        '301',
        [
          mk('2026-01-01 10:00:00', '三星武器A', 'Weapon', 3, '301', '1'),
          mk('2026-01-01 10:01:00', '三星武器B', 'Weapon', 3, '301', '2'),
          mk('2026-01-01 10:02:00', '角色A', 'Character', 5, '301', '3'),
          mk('2026-01-01 10:03:00', '四星角色', 'Character', 4, '301', '4'),
          mk('2026-01-01 10:04:00', '角色B', 'Character', 5, '301', '5')
        ]
      ],
      [
        '200',
        [
          mk('2026-01-02 10:00:00', '常驻五星武器', 'Weapon', 5, '200', '6'),
          mk('2026-01-02 10:01:00', '三星武器C', 'Weapon', 3, '200', '7')
        ]
      ]
    ])

    const profile = buildGachaProfile(result)

    expect(profile.totalPulls).toBe(7)
    expect(profile.totalFiveStars).toBe(3)
    expect(profile.avgPity).toBe(2)
    expect(profile.estimatedPrimogems).toBe(1120)
    expect(profile.luckTier).toBe('天选欧皇')
    expect(profile.tags).toContain('出金偏早')

    const pool301 = profile.pools.find((x) => x.pool === '301')
    expect(pool301).toBeDefined()
    expect(pool301?.fiveStarCount).toBe(2)
    expect(pool301?.avgPity).toBe(2.5)
    expect(pool301?.currentPity).toBe(0)
    expect(pool301?.fiveStars.map((x) => x.pity)).toEqual([3, 2])
  })

  it('handles no five-star data', () => {
    const result = new Map<string, WishRecord[]>([
      [
        '301',
        [
          mk('2026-01-01 10:00:00', '三星武器A', 'Weapon', 3, '301', '1'),
          mk('2026-01-01 10:01:00', '四星角色', 'Character', 4, '301', '2')
        ]
      ]
    ])

    const profile = buildGachaProfile(result)
    expect(profile.totalPulls).toBe(2)
    expect(profile.totalFiveStars).toBe(0)
    expect(profile.avgPity).toBeNull()
    expect(profile.luckTier).toBe('未出金')
    expect(profile.tags).toContain('尚未出金')
  })
})

