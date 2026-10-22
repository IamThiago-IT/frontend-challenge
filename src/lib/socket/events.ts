import { z } from 'zod'

import { idSchema, isoDateSchema, versionSchema } from '@/lib/api/contracts'
import { nftDetailSchema } from '@/features/catalog/contracts'
import { orderSchema } from '@/features/orders/contracts'

const realtimeEventBaseSchema = z.object({
  id: idSchema,
  resource: z.object({
    type: z.enum(['nft', 'order']),
    id: idSchema,
  }),
  version: versionSchema,
  occurredAt: isoDateSchema,
  userId: idSchema.optional(),
})

export const nftUpdatedEventSchema = realtimeEventBaseSchema.extend({
  type: z.literal('nft.updated'),
  resource: z.object({
    type: z.literal('nft'),
    id: idSchema,
  }),
  payload: z.object({
    nft: nftDetailSchema,
  }),
})

export const orderUpdatedEventSchema = realtimeEventBaseSchema.extend({
  type: z.literal('order.updated'),
  resource: z.object({
    type: z.literal('order'),
    id: idSchema,
  }),
  userId: idSchema,
  payload: z.object({
    order: orderSchema,
  }),
})

export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
])

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>

export type ServerToClientEvents = {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
}

export type ClientToServerEvents = {
  'session:hello': (payload: { token: string | null }) => void
}
