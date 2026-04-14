import path from 'node:path'
import os from 'node:os'
import fs from 'fs-extra'
import { glob } from 'glob'
import { CliError } from '../../model/errors.js'

const wishUrlRegex = /https.+?auth_appid=webview_gacha.+?authkey=.+?game_biz=hk4e_\w+/g

const getHome = (): string => os.homedir()

const detectLogs = async (): Promise<string[]> => {
  const base = path.join(getHome(), 'AppData', 'LocalLow', 'miHoYo')
  const logs = [
    path.join(base, '原神', 'output_log.txt'),
    path.join(base, 'Genshin Impact', 'output_log.txt')
  ]
  const out: string[] = []
  for (const file of logs) {
    if (await fs.pathExists(file)) out.push(file)
  }
  return out
}

const extractDataRoot = (logText: string): string | null => {
  const m = logText.match(/\w:\/.+(GenshinImpact_Data|YuanShen_Data)/)
  return m ? m[0] : null
}

const readLatestCache = async (dataRoot: string): Promise<string | null> => {
  const files = await glob(path.join(dataRoot, '/webCaches{/,/*/}Cache/Cache_Data/data_2'), {
    stat: true,
    withFileTypes: true,
    nodir: true,
    windowsPathsNoEscape: true
  })
  if (!files.length) return null
  const sorted = files.sort((a, b) => (b.mtimeMs ?? 0) - (a.mtimeMs ?? 0))
  const newest = sorted[0].fullpath()
  return fs.readFile(newest, 'utf8')
}

export const resolveWishUrlFromLogs = async (): Promise<string> => {
  const logs = await detectLogs()
  if (!logs.length) {
    throw new CliError('URL_NOT_FOUND', 'No game log file found')
  }

  for (const logFile of logs) {
    const logText = await fs.readFile(logFile, 'utf8')
    const root = extractDataRoot(logText)
    if (!root) continue
    const cacheText = await readLatestCache(root)
    if (!cacheText) continue
    const urls = cacheText.match(wishUrlRegex)
    if (urls && urls.length) {
      return urls[urls.length - 1]
    }
  }

  throw new CliError('URL_NOT_FOUND', 'Cannot find wish URL from game cache, open wish history first')
}
