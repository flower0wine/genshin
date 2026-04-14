import { Command } from 'commander'
import { prepareContext } from './context.js'
import { analyzeAll } from '../core/analyze/analyze.js'
import { CliError } from '../model/errors.js'
import { info } from '../infra/log.js'

export const registerAnalyze = (program: Command): void => {
  program
    .command('analyze')
    .description('Analyze local wish records')
    .option('--uid <uid>', 'Target uid')
    .option('--pool <key...>', 'Pool keys, e.g. 301 302')
    .option('--data-dir <path>', 'Data directory')
    .action(async (opts) => {
      const { accounts, config } = await prepareContext(opts.dataDir)
      const uid = opts.uid || config.current
      const account = accounts.get(uid)
      if (!account) throw new CliError('STORAGE_ERROR', `Account not found: ${uid}`)

      const summaries = analyzeAll(account.result, opts.pool)
      info(JSON.stringify({ uid, summaries }, null, 2))
    })
}
