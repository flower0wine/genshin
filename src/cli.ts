#!/usr/bin/env node
import { Command } from 'commander'
import { registerFetch } from './commands/fetch.js'
import { registerList } from './commands/list.js'
import { registerAnalyze } from './commands/analyze.js'
import { registerExportUigf } from './commands/export-uigf.js'
import { registerImportUigf } from './commands/import-uigf.js'
import { registerConfig } from './commands/config.js'
import { CliError } from './model/errors.js'
import { EXIT_CODE } from './model/constants.js'
import { error } from './infra/log.js'

const mapExit = (code: string): number => {
  if (code === 'ARG') return EXIT_CODE.ARG
  if (code === 'URL_NOT_FOUND' || code === 'URL_INVALID' || code === 'AUTHKEY_TIMEOUT' || code === 'AUTHKEY_INVALID') return EXIT_CODE.AUTH
  if (code === 'NETWORK_TIMEOUT' || code === 'NETWORK_ERROR') return EXIT_CODE.NETWORK
  if (code === 'SCHEMA_INVALID') return EXIT_CODE.SCHEMA
  if (code === 'STORAGE_ERROR') return EXIT_CODE.STORAGE
  return EXIT_CODE.UNKNOWN
}

const run = async (): Promise<void> => {
  const program = new Command()
  program.name('gwc').description('Genshin Wish CLI').version('0.1.0')

  registerFetch(program)
  registerList(program)
  registerAnalyze(program)
  registerExportUigf(program)
  registerImportUigf(program)
  registerConfig(program)

  await program.parseAsync(process.argv)
}

run().catch((e) => {
  if (e instanceof CliError) {
    error(`${e.code}: ${e.message}`)
    process.exit(mapExit(e.code))
  }
  const msg = e instanceof Error ? e.stack || e.message : String(e)
  error(msg)
  process.exit(EXIT_CODE.UNKNOWN)
})
