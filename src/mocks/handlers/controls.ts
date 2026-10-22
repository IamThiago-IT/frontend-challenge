import { http } from 'msw'
import { z } from 'zod'

import { positiveEthAmountSchema } from '@/lib/api/contracts'
import { nftAvailabilitySchema } from '@/features/catalog/contracts'
import {
  getMockDb,
  resetMockDb,
  getMockScenario,
  mutateMockDb,
  updateMockScenario,
} from '@/mocks/db'
import type { MockDb } from '@/mocks/db/schema'
import { jsonData, mockHandler, MockRequestError, readJson, readOptionalJson } from '@/mocks/http'
import { toOrder } from '@/mocks/domain/serializers'
import { settleDueOrders, settleOrder } from '@/mocks/domain/orders'
import { emitNftUpdated, emitOrderUpdated, replayMockEvents } from '@/mocks/ws/emitter'
import { disconnectMockSockets, getMockSocketCount } from '@/mocks/ws/server'
import { mockScenarioPatchSchema } from '@/mocks/scenario'

const updateNftSchema = z.object({
  nftId: z.string().min(1),
  availability: nftAvailabilitySchema.optional(),
  availableQuantity: z.number().int().nonnegative().optional(),
  priceEth: positiveEthAmountSchema.optional(),
  likes: z.number().int().nonnegative().optional(),
})

const orderEventSchema = z.object({
  orderId: z.string().min(1),
  settle: z.boolean().default(true),
})

const expireSessionSchema = z.object({
  userId: z.string().min(1).optional(),
})

const disconnectSocketSchema = z.object({
  userId: z.string().min(1).optional(),
})

function stateSummary(db: MockDb) {
  return {
    seedId: db.seedId,
    seedVersion: db.seedVersion,
    scenario: db.scenario,
    counts: {
      users: db.users.length,
      sessions: db.sessions.length,
      nfts: db.nfts.length,
      carts: Object.keys(db.carts).length,
      quotes: db.quotes.length,
      orders: db.orders.length,
      wallets: Object.values(db.wallets).reduce((total, wallets) => total + wallets.length, 0),
      sockets: getMockSocketCount(),
    },
    users: db.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
    })),
    orders: db.orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      status: order.status,
    })),
  }
}

export const controlsHandlers = [
  http.get(
    '/__mocks__/state',
    mockHandler(
      () => {
        settleDueOrders()

        return jsonData(stateSummary(getMockDb()))
      },
      { controls: true },
    ),
  ),
  http.post(
    '/__mocks__/reset',
    mockHandler(
      () => {
        const db = resetMockDb()

        return jsonData(stateSummary(db))
      },
      { controls: true },
    ),
  ),
  http.get(
    '/__mocks__/scenario',
    mockHandler(() => jsonData(getMockScenario()), { controls: true }),
  ),
  http.put(
    '/__mocks__/scenario',
    mockHandler(
      async ({ request }) => {
        const patch = await readJson(request, mockScenarioPatchSchema)

        return jsonData(updateMockScenario(patch))
      },
      { controls: true },
    ),
  ),
  http.post(
    '/__mocks__/events/nft',
    mockHandler(
      async ({ request }) => {
        const input = await readJson(request, updateNftSchema)
        const updated = mutateMockDb((db) => {
          const nft = db.nfts.find((item) => item.id === input.nftId)

          if (!nft) {
            return null
          }

          if (input.priceEth !== undefined) {
            nft.priceEth = input.priceEth
          }

          if (input.likes !== undefined) {
            nft.likes = input.likes
          }

          if (input.availableQuantity !== undefined) {
            nft.availableQuantity = Math.min(input.availableQuantity, nft.editionSize)
            nft.editionSold = nft.editionSize - nft.availableQuantity
            nft.availability =
              input.availability ?? (nft.availableQuantity > 0 ? 'available' : 'sold_out')
          } else if (input.availability === 'sold_out') {
            nft.availableQuantity = 0
            nft.editionSold = nft.editionSize
            nft.availability = 'sold_out'
          } else if (input.availability === 'unavailable') {
            nft.availableQuantity = 0
            nft.availability = 'unavailable'
          } else if (input.availability === 'available') {
            nft.availability = 'available'

            if (nft.availableQuantity === 0) {
              nft.availableQuantity = Math.max(1, nft.editionSize - nft.editionSold)
              nft.editionSold = nft.editionSize - nft.availableQuantity
            }
          }

          nft.version += 1
          nft.updatedAt = new Date().toISOString()

          return structuredClone(nft)
        })

        if (!updated) {
          throw new MockRequestError(404, 'NOT_FOUND', 'NFT não encontrado.')
        }

        const event = emitNftUpdated(updated)

        return jsonData(event.payload.nft)
      },
      { controls: true },
    ),
  ),
  http.post(
    '/__mocks__/events/order',
    mockHandler(
      async ({ request }) => {
        const input = await readJson(request, orderEventSchema)
        const storedOrder = getMockDb().orders.find((order) => order.id === input.orderId)

        if (!storedOrder) {
          throw new MockRequestError(404, 'NOT_FOUND', 'Pedido não encontrado.')
        }

        const wasPending = storedOrder.status === 'pending'

        if (input.settle && wasPending) {
          settleOrder(storedOrder.id)
        }

        const currentOrder = getMockDb().orders.find((order) => order.id === input.orderId)

        if (!currentOrder) {
          throw new MockRequestError(404, 'NOT_FOUND', 'Pedido não encontrado.')
        }

        if (!input.settle || !wasPending) {
          emitOrderUpdated(toOrder(currentOrder), currentOrder.userId)
        }

        return jsonData(toOrder(currentOrder))
      },
      { controls: true },
    ),
  ),
  http.post(
    '/__mocks__/events/replay',
    mockHandler(
      () => {
        const events = replayMockEvents()

        return jsonData({
          count: events.length,
        })
      },
      { controls: true },
    ),
  ),
  http.post(
    '/__mocks__/session/expire',
    mockHandler(
      async ({ request }) => {
        const input = await readOptionalJson(request, expireSessionSchema)
        const removed = mutateMockDb((db) => {
          const before = db.sessions.length

          db.sessions = input.userId
            ? db.sessions.filter((session) => session.userId !== input.userId)
            : []

          return before - db.sessions.length
        })

        return jsonData({
          removed,
        })
      },
      { controls: true },
    ),
  ),
  http.post(
    '/__mocks__/socket/disconnect',
    mockHandler(
      async ({ request }) => {
        const input = await readOptionalJson(request, disconnectSocketSchema)

        return jsonData({
          disconnected: disconnectMockSockets(input.userId),
        })
      },
      { controls: true },
    ),
  ),
]
