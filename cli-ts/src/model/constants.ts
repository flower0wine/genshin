export const DEFAULT_API_DOMAIN_CN = 'https://public-operation-hk4e.mihoyo.com'
export const DEFAULT_API_DOMAIN_OS = 'https://public-operation-hk4e-sg.hoyoverse.com'
export const POOL_ORDER = ['301', '302', '200', '500', '100'] as const

export const DEFAULT_TYPE_MAP = new Map<string, string>([
  ['301', 'Character Event Wish'],
  ['302', 'Weapon Event Wish'],
  ['500', 'Chronicled Wish'],
  ['200', 'Permanent Wish'],
  ['100', 'Novice Wish']
])

export const EXIT_CODE = {
  OK: 0,
  ARG: 2,
  AUTH: 3,
  NETWORK: 4,
  STORAGE: 5,
  SCHEMA: 6,
  UNKNOWN: 10
} as const

export const DEFAULT_CONFIG = {
  current: '',
  lang: 'en-us',
  proxyPort: 8325,
  fetchFullHistory: false
}
