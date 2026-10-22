import { z } from 'zod'

import { idSchema, isoDateSchema } from '@/lib/api/contracts'

export const userProfileSchema = z.object({
  id: idSchema,
  name: z.string().min(2).max(80),
  email: z.email(),
  username: z.string().min(3).max(32),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  joinedAt: isoDateSchema,
})

export const authResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: isoDateSchema,
  user: userProfileSchema,
})

export const sessionResponseSchema = z.object({
  expiresAt: isoDateSchema,
  user: userProfileSchema,
})

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres')
    .max(72, 'A senha deve ter no máximo 72 caracteres'),
})

export const redirectSearchSchema = z.object({
  redirect: z.string().max(2048).optional().catch(undefined),
})

export type UserProfile = z.infer<typeof userProfileSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type RedirectSearch = z.infer<typeof redirectSearchSchema>
