export const info = (msg: string): void => {
  process.stdout.write(`${msg}\n`)
}

export const warn = (msg: string): void => {
  process.stderr.write(`[warn] ${msg}\n`)
}

export const error = (msg: string): void => {
  process.stderr.write(`[error] ${msg}\n`)
}
