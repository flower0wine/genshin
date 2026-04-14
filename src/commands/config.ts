import { Command } from 'commander'
import { prepareContext } from './context.js'
import { saveConfig } from '../config/config.js'
import { info } from '../infra/log.js'

export const registerConfig = (program: Command): void => {
  program
    .command('config')
    .description('Read or write cli config')
    .option('--get <key>', 'Get config value')
    .option('--set <pair>', 'Set key=value')
    .option('--data-dir <path>', 'Data directory')
    .action(async (opts) => {
      const { dataDir, config } = await prepareContext(opts.dataDir)

      if (opts.get) {
        info(JSON.stringify({ key: opts.get, value: (config as Record<string, unknown>)[opts.get] }, null, 2))
        return
      }

      if (opts.set) {
        const [k, ...rest] = String(opts.set).split('=')
        const raw = rest.join('=')
        const value: unknown = raw === 'true' ? true : raw === 'false' ? false : /^\d+$/.test(raw) ? Number(raw) : raw
        const next = await saveConfig(dataDir, { [k]: value } as Record<string, unknown>)
        info(JSON.stringify(next, null, 2))
        return
      }

      info(JSON.stringify(config, null, 2))
    })
}
