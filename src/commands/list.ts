import { Command } from 'commander'
import { prepareContext } from './context.js'
import { countRecords } from '../infra/fs/store.js'
import { info } from '../infra/log.js'

export const registerList = (program: Command): void => {
  program
    .command('list')
    .description('List local accounts')
    .option('--data-dir <path>', 'Data directory')
    .action(async (opts) => {
      const { accounts, config } = await prepareContext(opts.dataDir)
      const rows = [...accounts.values()].map((acc) => ({
        uid: acc.uid,
        lang: acc.lang,
        total: countRecords(acc.result),
        updatedAt: new Date(acc.time).toISOString(),
        current: config.current === acc.uid
      }))
      info(JSON.stringify(rows, null, 2))
    })
}
