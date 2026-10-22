import { z } from 'zod'

import {
  ethAmountSchema,
  idSchema,
  isoDateSchema,
  paginatedSchema,
  positiveEthAmountSchema,
  versionSchema,
} from '@/lib/api/contracts'

export const categoryIdSchema = z.enum([
  'art',
  'music',
  'photography',
  'collectibles',
  'metaverse',
  'sports',
])

export const nftAvailabilitySchema = z.enum(['available', 'sold_out', 'unavailable'])
export const nftSortSchema = z.enum(['recent', 'price-asc', 'price-desc', 'popular'])

export const nftCategorySchema = z.object({
  id: categoryIdSchema,
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
})

export const nftCreatorSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  avatarUrl: z.string(),
  verified: z.boolean(),
})

export const nftCollectionSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
})

export const nftAttributeSchema = z.object({
  traitType: z.string().min(1),
  value: z.string().min(1),
})

export const nftSummarySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  category: categoryIdSchema,
  collection: nftCollectionSchema,
  creator: nftCreatorSchema,
  priceEth: positiveEthAmountSchema,
  currency: z.literal('ETH'),
  availability: nftAvailabilitySchema,
  availableQuantity: z.number().int().nonnegative(),
  editionSize: z.number().int().positive(),
  editionSold: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  featured: z.boolean(),
  version: versionSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string().min(1),
  gallery: z.array(z.string().min(1)).min(1),
  attributes: z.array(nftAttributeSchema),
})

export const nftListResponseSchema = paginatedSchema(nftSummarySchema)
export const nftCategoriesResponseSchema = z.array(nftCategorySchema)

const categoryFilterSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return Array.isArray(value) ? value : [value]
}, z.array(categoryIdSchema).optional())

const featuredFilterSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return value
}, z.boolean().optional())

export const nftListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  categories: categoryFilterSchema,
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  availability: nftAvailabilitySchema.optional(),
  featured: featuredFilterSchema,
  sort: nftSortSchema.default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
})

export type CategoryId = z.infer<typeof categoryIdSchema>
export type NftAvailability = z.infer<typeof nftAvailabilitySchema>
export type NftSort = z.infer<typeof nftSortSchema>
export type NftCategory = z.infer<typeof nftCategorySchema>
export type NftSummary = z.infer<typeof nftSummarySchema>
export type NftDetail = z.infer<typeof nftDetailSchema>
export type NftListResponse = z.infer<typeof nftListResponseSchema>
export type NftListParams = {
  q?: string
  categories?: CategoryId[]
  minPrice?: string
  maxPrice?: string
  availability?: NftAvailability
  featured?: boolean
  sort: NftSort
  page: number
  pageSize: number
}
