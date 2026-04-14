import { resolveDataDir, loadConfig, saveConfig } from '../config/config.js'
import { loadAccounts } from '../infra/fs/store.js'

export const prepareContext = async (dataDirArg?: string) => {
  const dataDir = resolveDataDir(dataDirArg)
  const config = await loadConfig(dataDir)
  const accounts = await loadAccounts(dataDir)
  return { dataDir, config, accounts }
}

export const updateCurrentUid = async (dataDir: string, uid: string): Promise<void> => {
  await saveConfig(dataDir, { current: uid })
}
