import path from 'node:path'
import fs from 'fs-extra'
import type { AccountData, StoredAccountData, WishRecord } from '../../model/types.js'

export const toStored = (data: AccountData): StoredAccountData => ({
  uid: data.uid,
  lang: data.lang,
  time: data.time,
  typeMap: [...data.typeMap],
  result: [...data.result]
})

export const fromStored = (data: StoredAccountData): AccountData => ({
  uid: data.uid,
  lang: data.lang,
  time: data.time,
  typeMap: new Map(data.typeMap),
  result: new Map(data.result)
})

export const accountFile = (dataDir: string, uid: string): string => path.join(dataDir, `gacha-list-${uid}.json`)

export const loadAccounts = async (dataDir: string): Promise<Map<string, AccountData>> => {
  await fs.ensureDir(dataDir)
  const files = await fs.readdir(dataDir)
  const out = new Map<string, AccountData>()
  for (const file of files) {
    if (!/^gacha-list-\d+\.json$/.test(file)) continue
    const parsed = await fs.readJSON(path.join(dataDir, file)) as StoredAccountData
    const account = fromStored(parsed)
    out.set(account.uid, account)
  }
  return out
}

export const saveAccount = async (dataDir: string, data: AccountData): Promise<void> => {
  await fs.ensureDir(dataDir)
  await fs.writeJSON(accountFile(dataDir, data.uid), toStored(data), { spaces: 2 })
}

export const countRecords = (result: Map<string, WishRecord[]>): number => {
  let total = 0
  for (const [, list] of result) total += list.length
  return total
}

export const backupAccount = async (dataDir: string, uid: string): Promise<void> => {
  const file = accountFile(dataDir, uid)
  if (!(await fs.pathExists(file))) return
  const backupDir = path.join(dataDir, 'backup', uid)
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15)
  await fs.ensureDir(backupDir)
  await fs.copy(file, path.join(backupDir, `gacha-list-${uid}-${stamp}.json`))
}
