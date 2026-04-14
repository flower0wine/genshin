import { Command } from 'commander'
import { prepareContext, updateCurrentUid } from './context.js'
import { parseWishUrl } from '../core/auth/url.js'
import { resolveWishUrlFromLogs } from '../core/auth/auto-url.js'
import { fetchAccount } from '../core/fetch/wish-fetcher.js'
import { saveAccount } from '../infra/fs/store.js'
import { info } from '../infra/log.js'

export const registerFetch = (program: Command): void => {
  program
    .command('fetch')
    .description('Fetch and merge wish records')
    .option('--url <wishUrl>', 'Wish history URL')
    .option('--auto', 'Resolve URL from game logs', true)
    .option('--full', 'Fetch full history, disable incremental stop', false)
    .option('--data-dir <path>', 'Data directory')
    .action(async (opts) => {
      const { dataDir, accounts, config } = await prepareContext(opts.dataDir)

      const wishUrl = opts.url || (opts.auto ? await resolveWishUrlFromLogs() : '')
      const { apiDomain, query } = parseWishUrl(wishUrl)

      const local = config.current ? accounts.get(config.current) : undefined
      const { account, output } = await fetchAccount(apiDomain, query, local, opts.full)
      await saveAccount(dataDir, account)
      await updateCurrentUid(dataDir, account.uid)
      info(JSON.stringify(output, null, 2))
    })
}
