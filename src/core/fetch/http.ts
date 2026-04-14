import { CliError } from '../../model/errors.js'

export const requestJson = async <T>(url: string, timeoutMs = 15000): Promise<T> => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    const text = await res.text()
    try {
      return JSON.parse(text) as T
    } catch {
      throw new CliError('API_ERROR', `Non-JSON response: ${res.status}`)
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new CliError('NETWORK_TIMEOUT', `Request timeout: ${url}`)
    }
    throw new CliError('NETWORK_ERROR', `Network error: ${url}`)
  } finally {
    clearTimeout(timer)
  }
}

export const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
