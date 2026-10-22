import { z } from 'zod'

import { ethAmountSchema } from '@/lib/api/contracts'
import {
  categoryIdSchema,
  nftAvailabilitySchema,
  nftSortSchema,
  type NftListParams,
} from '@/features/catalog/contracts'

const categoriesSearchSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return []
  }

  return Array.isArray(value) ? value : [value]
}, z.array(categoryIdSchema).catch([]))

const priceSearchSchema = ethAmountSchema.optional().catch(undefined)
const availabilitySearchSchema = nftAvailabilitySchema.optional().catch(undefined)

const featuredSearchSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return value
}, z.boolean().optional().catch(undefined))

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  categories: categoriesSearchSchema,
  minPrice: priceSearchSchema,
  maxPrice: priceSearchSchema,
  availability: availabilitySearchSchema,
  featured: featuredSearchSchema,
  sort: nftSortSchema.catch('recent'),
  page: z.coerce.number().int().min(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const catalogSearchDefaults = {
  categories: [],
  sort: 'recent',
  page: 1,
} satisfies CatalogSearch

export function toNftListParams(search: CatalogSearch): NftListParams {
  const categories = [...new Set(search.categories)].sort()

  return {
    q: search.q || undefined,
    categories: categories.length > 0 ? categories : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    availability: search.availability,
    featured: search.featured,
    sort: search.sort,
    page: search.page,
    pageSize: 12,
  }
}
