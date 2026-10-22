export const mockDbStorageKey = 'nft-marketplace:mock-db'

export type MockStorage = {
  read: () => string | null
  write: (value: string) => void
  clear: () => void
}

let memoryValue: string | null = null

const memoryStorage: MockStorage = {
  read: () => memoryValue,
  write: (value) => {
    memoryValue = value
  },
  clear: () => {
    memoryValue = null
  },
}

const browserStorage: MockStorage = {
  read: () => {
    try {
      return window.localStorage.getItem(mockDbStorageKey)
    } catch {
      return memoryValue
    }
  },
  write: (value) => {
    memoryValue = value

    try {
      window.localStorage.setItem(mockDbStorageKey, value)
    } catch {
      return
    }
  },
  clear: () => {
    memoryValue = null

    try {
      window.localStorage.removeItem(mockDbStorageKey)
    } catch {
      return
    }
  },
}

export function getMockStorage(): MockStorage {
  return typeof window === 'undefined' ? memoryStorage : browserStorage
}
