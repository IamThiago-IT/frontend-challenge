import type { NftDetail } from '@/features/catalog/contracts'
import type { Order } from '@/features/orders/contracts'
import type { RealtimeEvent } from '@/lib/socket/events'
import { mutateMockDb, nextMockId } from '@/mocks/db'
import { nowIso } from '@/mocks/domain/time'

let activeEmitter: ((event: RealtimeEvent) => void) | null = null

export function setMockRealtimeEmitter(emitter: ((event: RealtimeEvent) => void) | null) {
  activeEmitter = emitter
}

function recordEvent(event: RealtimeEvent) {
  activeEmitter?.(event)
}

export function emitNftUpdated(nft: NftDetail, userId?: string) {
  const event = mutateMockDb((db) => {
    const nextEvent = {
      id: nextMockId(db, 'event'),
      type: 'nft.updated' as const,
      resource: {
        type: 'nft' as const,
        id: nft.id,
      },
      version: nft.version,
      occurredAt: nowIso(),
      ...(userId ? { userId } : {}),
      payload: {
        nft: structuredClone(nft),
      },
    }

    db.lastEvents = [...db.lastEvents, nextEvent].slice(-50)

    return nextEvent
  })

  recordEvent(event)

  return event
}

export function emitOrderUpdated(order: Order, userId: string) {
  const event = mutateMockDb((db) => {
    const nextEvent = {
      id: nextMockId(db, 'event'),
      type: 'order.updated' as const,
      resource: {
        type: 'order' as const,
        id: order.id,
      },
      version: order.version,
      occurredAt: nowIso(),
      userId,
      payload: {
        order: structuredClone(order),
      },
    }

    db.lastEvents = [...db.lastEvents, nextEvent].slice(-50)

    return nextEvent
  })

  recordEvent(event)

  return event
}

export function getRecentMockEvents() {
  return mutateMockDb((db) => db.lastEvents)
}

export function replayMockEvents() {
  const events = getRecentMockEvents()
  events.forEach(recordEvent)

  return events
}
