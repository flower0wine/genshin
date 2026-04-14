import { URL } from 'node:url'
import { DEFAULT_API_DOMAIN_CN, DEFAULT_API_DOMAIN_OS } from '../../model/constants.js'
import { CliError } from '../../model/errors.js'

export const fixAuthkey = (url: string): string => {
  const mr = url.match(/authkey=([^&]+)/)
  if (mr && mr[1] && mr[1].includes('=') && !mr[1].includes('%')) {
    return url.replace(/authkey=([^&]+)/, `authkey=${encodeURIComponent(mr[1])}`)
  }
  return url
}

export const detectApiDomain = (host: string): string => {
  if (host.includes('webstatic-sea') || host.includes('hk4e-api-os') || host.includes('hoyoverse.com')) {
    return DEFAULT_API_DOMAIN_OS
  }
  return DEFAULT_API_DOMAIN_CN
}

export const parseWishUrl = (rawUrl: string): { apiDomain: string; query: URLSearchParams } => {
  let parsed: URL
  try {
    parsed = new URL(fixAuthkey(rawUrl))
  } catch {
    throw new CliError('URL_INVALID', 'Invalid wish URL')
  }
  const apiDomain = detectApiDomain(parsed.host)
  const searchParams = parsed.searchParams
  const authkey = searchParams.get('authkey')
  if (!authkey) {
    throw new CliError('AUTHKEY_INVALID', 'authkey not found in URL')
  }

  searchParams.delete('page')
  searchParams.delete('size')
  searchParams.delete('gacha_type')
  searchParams.delete('end_id')

  return { apiDomain, query: searchParams }
}
