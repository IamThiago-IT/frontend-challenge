import { z } from 'zod'

import { idSchema, isoDateSchema } from '@/lib/api/contracts'
import { nftSummarySchema } from '@/features/catalog/contracts'

export const favoritesResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  ids: z.array(idSchema),
  total: z.number().int().nonnegative(),
})

export const favoriteMutationResponseSchema = z.object({
  favorited: z.boolean(),
  favoritedAt: isoDateSchema.nullable(),
})

export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>
export type FavoriteMutationResponse = z.infer<typeof favoriteMutationResponseSchema>
