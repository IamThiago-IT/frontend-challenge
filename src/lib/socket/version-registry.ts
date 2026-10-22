import type { RealtimeEvent } from '@/lib/socket/events'

type ResourceType = RealtimeEvent['resource']['type']

const resourceVersions = new Map<string, number>()
const seenEventIds = new Set<string>()
const seenEventQueue: string[] = []
const maxSeenEvents = 1_000

function resourceKey(type: ResourceType, id: string) {
  return `${type}:${id}`
}

export function registerResourceVersion(type: ResourceType, id: string, version: number) {
  const key = resourceKey(type, id)
  const currentVersion = resourceVersions.get(key) ?? -1

  if (version > currentVersion) {
    resourceVersions.set(key, version)
  }
}

export function getResourceVersion(type: ResourceType, id: string) {
  return resourceVersions.get(resourceKey(type, id)) ?? -1
}

export function registerNftVersions(items: Array<{ id: string; version: number }>) {
  for (const item of items) {
    registerResourceVersion('nft', item.id, item.version)
  }
}

export function registerOrderVersion(order: { id: string; version: number }) {
  registerResourceVersion('order', order.id, order.version)
}

export function acceptRealtimeEvent(event: RealtimeEvent) {
  if (seenEventIds.has(event.id)) {
    return false
  }

  const currentVersion = getResourceVersion(event.resource.type, event.resource.id)

  if (event.version <= currentVersion) {
    return false
  }

  registerResourceVersion(event.resource.type, event.resource.id, event.version)
  seenEventIds.add(event.id)
  seenEventQueue.push(event.id)

  if (seenEventQueue.length > maxSeenEvents) {
    const oldestEventId = seenEventQueue.shift()

    if (oldestEventId) {
      seenEventIds.delete(oldestEventId)
    }
  }

  return true
}

export function clearRealtimeRegistry() {
  resourceVersions.clear()
  seenEventIds.clear()
  seenEventQueue.length = 0
}
