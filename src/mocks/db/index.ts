import { mockDbSchemaVersion, mockSeedVersion, type MockDb } from '@/mocks/db/schema'
import { createSeedDb } from '@/mocks/db/seed'
import { getMockStorage } from '@/mocks/db/storage'
import type { MockScenario, MockScenarioPatch } from '@/mocks/scenario'

let currentDb: MockDb | null = null

function parseStoredDb(value: string | null): MockDb | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as MockDb

    if (parsed.schemaVersion !== mockDbSchemaVersion || parsed.seedVersion !== mockSeedVersion) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function persistDb(db: MockDb) {
  getMockStorage().write(JSON.stringify(db))
}

export function getMockDb() {
  if (currentDb) {
    return currentDb
  }

  const storedDb = parseStoredDb(getMockStorage().read())

  if (storedDb) {
    currentDb = storedDb
    return currentDb
  }

  currentDb = createSeedDb()
  persistDb(currentDb)

  return currentDb
}

export function saveMockDb(db: MockDb) {
  currentDb = db
  persistDb(db)

  return db
}

export function mutateMockDb<T>(mutator: (draft: MockDb) => T): T {
  const draft = structuredClone(getMockDb())
  const result = mutator(draft)
  saveMockDb(draft)

  return result
}

export function resetMockDb() {
  getMockStorage().clear()
  currentDb = createSeedDb()
  persistDb(currentDb)

  return currentDb
}

export function nextMockId(db: MockDb, prefix: string) {
  const nextValue = (db.counters[prefix] ?? 0) + 1
  db.counters[prefix] = nextValue

  return `${prefix}-${db.seedId}-${nextValue}`
}

export function getMockScenario() {
  return getMockDb().scenario
}

export function updateMockScenario(patch: MockScenarioPatch): MockScenario {
  return mutateMockDb((db) => {
    db.scenario = {
      ...db.scenario,
      ...patch,
      latencyCursor: 0,
    }

    return db.scenario
  })
}
