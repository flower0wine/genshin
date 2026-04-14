import path from 'node:path'
import fs from 'fs-extra'
import { Command } from 'commander'
import { prepareContext } from './context.js'
import { exportUigf30, exportUigf41 } from '../core/uigf/exporter.js'
import { CliError } from '../model/errors.js'
import { info } from '../infra/log.js'

export const registerExportUigf = (program: Command): void => {
  program
    .command('export-uigf')
    .description('Export UIGF JSON')
    .option('--uid <uid>', 'Target uid')
    .option('--version <version>', '3.0 or 4.1', '4.1')
    .option('--out <file>', 'Output JSON file')
    .option('--data-dir <path>', 'Data directory')
    .action(async (opts) => {
      const { accounts, config } = await prepareContext(opts.dataDir)
      const version = String(opts.version)
      if (version !== '3.0' && version !== '4.1') {
        throw new CliError('ARG', 'version must be 3.0 or 4.1')
      }

      let payload: unknown
      if (version === '3.0') {
        const uid = opts.uid || config.current
        const account = accounts.get(uid)
        if (!account) throw new CliError('STORAGE_ERROR', `Account not found: ${uid}`)
        payload = exportUigf30(account)
      } else {
        const list = opts.uid ? [accounts.get(opts.uid)].filter(Boolean) : [...accounts.values()]
        if (!list.length) throw new CliError('STORAGE_ERROR', 'No account to export')
        payload = exportUigf41(list as any)
      }

      const outFile = opts.out || path.resolve(`UIGF_v${version}_${Date.now()}.json`)
      await fs.ensureDir(path.dirname(outFile))
      await fs.writeJSON(outFile, payload, { spaces: 2 })
      info(outFile)
    })
}
