export function nowIso() {
  return new Date().toISOString()
}

export function addMilliseconds(isoDate: string, milliseconds: number) {
  return new Date(Date.parse(isoDate) + milliseconds).toISOString()
}

export function isExpired(isoDate: string) {
  return Date.parse(isoDate) <= Date.now()
}
