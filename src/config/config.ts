import path from 'node:path'
import os from 'node:os'
import fs from 'fs-extra'
import { DEFAULT_CONFIG } from '../model/constants.js'

export type CliConfig = typeof DEFAULT_CONFIG & {
  dataDir?: string
}

export const resolveDataDir = (dataDir?: string): string => {
  if (dataDir) return path.resolve(dataDir)
  return path.join(os.homedir(), '.genshin-wish-cli')
}

export const getConfigPath = (dataDir: string): string => path.join(dataDir, 'config.json')

export const loadConfig = async (dataDir: string): Promise<CliConfig> => {
  const file = getConfigPath(dataDir)
  if (!(await fs.pathExists(file))) {
    return { ...DEFAULT_CONFIG, dataDir }
  }
  const parsed = await fs.readJSON(file)
  return { ...DEFAULT_CONFIG, ...parsed, dataDir }
}

export const saveConfig = async (dataDir: string, config: Partial<CliConfig>): Promise<CliConfig> => {
  const prev = await loadConfig(dataDir)
  const next = { ...prev, ...config }
  await fs.ensureDir(dataDir)
  await fs.writeJSON(getConfigPath(dataDir), next, { spaces: 2 })
  return next
}
