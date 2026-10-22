const idempotencyKeyPrefix = 'nft-marketplace:idempotency:'
const memoryKeys = new Map<string, string>()

function readSessionStorage(key: string) {
  if (typeof window === 'undefined') {
    return memoryKeys.get(key) ?? null
  }

  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return memoryKeys.get(key) ?? null
  }
}

function writeSessionStorage(key: string, value: string) {
  memoryKeys.set(key, value)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    return
  }
}

function removeSessionStorage(key: string) {
  memoryKeys.delete(key)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.removeItem(key)
  } catch {
    return
  }
}

export function createIdempotencyKey(scope: string) {
  return `${scope}-${crypto.randomUUID()}`
}

export function getOrCreateIdempotencyKey(scope: string) {
  const storageKey = `${idempotencyKeyPrefix}${scope}`
  const existingKey = readSessionStorage(storageKey)

  if (existingKey) {
    return existingKey
  }

  const key = createIdempotencyKey(scope)
  writeSessionStorage(storageKey, key)

  return key
}

export function clearIdempotencyKey(scope: string) {
  removeSessionStorage(`${idempotencyKeyPrefix}${scope}`)
}
