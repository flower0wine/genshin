import fs from 'fs-extra'
import { Command } from 'commander'
import { prepareContext, updateCurrentUid } from './context.js'
import { backupAccount, saveAccount } from '../infra/fs/store.js'
import { importAnyJson } from '../core/uigf/importer.js'
import { CliError } from '../model/errors.js'
import { info } from '../infra/log.js'

export const registerImportUigf = (program: Command): void => {
  program
    .command('import-uigf')
    .description('Import UIGF/local JSON')
    .requiredOption('--file <path>', 'Input JSON file')
    .option('--backup', 'Backup before overwrite', true)
    .option('--data-dir <path>', 'Data directory')
    .action(async (opts) => {
      const { dataDir } = await prepareContext(opts.dataDir)
      if (!(await fs.pathExists(opts.file))) {
        throw new CliError('ARG', `File not found: ${opts.file}`)
      }
      const payload = await fs.readJSON(opts.file)
      const accounts = importAnyJson(payload)

      for (const account of accounts) {
        if (opts.backup) {
          await backupAccount(dataDir, account.uid)
        }
        await saveAccount(dataDir, account)
        await updateCurrentUid(dataDir, account.uid)
      }

      info(JSON.stringify({ imported: accounts.map((x) => x.uid), count: accounts.length }, null, 2))
    })
}
