export type ErrorCode =
  | 'ARG'
  | 'URL_NOT_FOUND'
  | 'URL_INVALID'
  | 'AUTHKEY_TIMEOUT'
  | 'AUTHKEY_INVALID'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'SCHEMA_INVALID'
  | 'STORAGE_ERROR'
  | 'UNKNOWN'

export class CliError extends Error {
  code: ErrorCode
  context?: Record<string, unknown>

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.context = context
  }
}
