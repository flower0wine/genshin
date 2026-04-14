import { Command } from 'commander'
import path from 'node:path'
import fs from 'fs-extra'
import { prepareContext } from './context.js'
import { analyzeAll } from '../core/analyze/analyze.js'
import { buildGachaProfile } from '../core/analyze/profile.js'
import { CliError } from '../model/errors.js'
import { info } from '../infra/log.js'

export const registerAnalyze = (program: Command): void => {
  program
    .command('analyze')
    .description('Analyze local wish records')
    .option('--uid <uid>', 'Target uid')
    .option('--pool <key...>', 'Pool keys, e.g. 301 302')
    .option('--profile', 'Output advanced gacha profile JSON', false)
    .option('--profile-json <file>', 'Write advanced gacha profile JSON to file')
    .option('--data-dir <path>', 'Data directory')
    .action(async (opts) => {
      const { accounts, config } = await prepareContext(opts.dataDir)
      const uid = opts.uid || config.current
      const account = accounts.get(uid)
      if (!account) throw new CliError('STORAGE_ERROR', `Account not found: ${uid}`)

      if (opts.profile || opts.profileJson) {
        const profile = buildGachaProfile(account.result, opts.pool)
        const payload = { uid, profile }

        if (opts.profileJson) {
          const outFile = path.resolve(String(opts.profileJson))
          await fs.ensureDir(path.dirname(outFile))
          await fs.writeJSON(outFile, payload, { spaces: 2 })
          info(outFile)
        }

        if (opts.profile || !opts.profileJson) {
          info(JSON.stringify(payload, null, 2))
        }
        return
      }

      const summaries = analyzeAll(account.result, opts.pool)
      info(JSON.stringify({ uid, summaries }, null, 2))
    })
}
