export const sessionTokenStorageKey = 'nft-marketplace:session-token'
export const guestIdStorageKey = 'nft-marketplace:guest-id'

const memoryStorage = new Map<string, string>()

function readStorage(key: string) {
  if (typeof window === 'undefined') {
    return memoryStorage.get(key) ?? null
  }

  try {
    return window.localStorage.getItem(key)
  } catch {
    return memoryStorage.get(key) ?? null
  }
}

function writeStorage(key: string, value: string) {
  memoryStorage.set(key, value)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

function removeStorage(key: string) {
  memoryStorage.delete(key)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}

export function getSessionToken() {
  return readStorage(sessionTokenStorageKey)
}

export function setSessionToken(token: string) {
  writeStorage(sessionTokenStorageKey, token)
}

export function clearSessionToken() {
  removeStorage(sessionTokenStorageKey)
}

export function getGuestId() {
  return readStorage(guestIdStorageKey)
}

export function setGuestId(guestId: string) {
  writeStorage(guestIdStorageKey, guestId)
}

export function clearGuestId() {
  removeStorage(guestIdStorageKey)
}

export function getOrCreateGuestId() {
  const existingGuestId = getGuestId()

  if (existingGuestId) {
    return existingGuestId
  }

  const guestId = `guest-${crypto.randomUUID()}`
  setGuestId(guestId)

  return guestId
}
