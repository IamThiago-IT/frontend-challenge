import type { OrderCollector, QuoteRequest } from '@/features/checkout/contracts'

export type CheckoutStep = 'details' | 'review'

export type CheckoutDraft = {
  collectorName: string
  collectorEmail: string
  network: QuoteRequest['network']
  walletId: string | null
  step: CheckoutStep
}

export type PendingOrderAttempt = {
  quoteId: string
  walletId: string
  network: QuoteRequest['network']
  collector: OrderCollector
  idempotencyKey: string
  createdAt: string
}

const storagePrefix = 'nft-marketplace:checkout:'
const memoryStorage = new Map<string, string>()

export function orderIdempotencyScope(userId: string, quoteId: string) {
  return `order:${userId}:${quoteId}`
}

function draftKey(userId: string) {
  return `${storagePrefix}draft:${userId}`
}

function attemptKey(userId: string) {
  return `${storagePrefix}attempt:${userId}`
}

function readStorage(key: string) {
  if (typeof window === 'undefined') {
    return memoryStorage.get(key) ?? null
  }

  try {
    return window.sessionStorage.getItem(key)
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
    window.sessionStorage.setItem(key, value)
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
    window.sessionStorage.removeItem(key)
  } catch {
    return
  }
}

function readJson<T>(key: string): T | null {
  const value = readStorage(key)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    removeStorage(key)
    return null
  }
}

export function getCheckoutDraft(userId: string) {
  return readJson<CheckoutDraft>(draftKey(userId))
}

export function saveCheckoutDraft(userId: string, draft: CheckoutDraft) {
  writeStorage(draftKey(userId), JSON.stringify(draft))
}

export function clearCheckoutDraft(userId: string) {
  removeStorage(draftKey(userId))
}

export function getPendingOrderAttempt(userId: string) {
  return readJson<PendingOrderAttempt>(attemptKey(userId))
}

export function savePendingOrderAttempt(userId: string, attempt: PendingOrderAttempt) {
  writeStorage(attemptKey(userId), JSON.stringify(attempt))
}

export function clearPendingOrderAttempt(userId: string) {
  removeStorage(attemptKey(userId))
}

function collectSessionStorageKeys(keys: Set<string>) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index)

      if (key) {
        keys.add(key)
      }
    }
  } catch {
    return
  }
}

export function clearAllCheckoutStorage() {
  const keys = new Set<string>()

  memoryStorage.forEach((_value, key) => keys.add(key))
  collectSessionStorageKeys(keys)

  keys.forEach((key) => {
    if (key.startsWith(storagePrefix)) {
      removeStorage(key)
    }
  })
}
