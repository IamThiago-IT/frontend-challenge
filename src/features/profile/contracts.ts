import { z } from 'zod'

import { userProfileSchema } from '@/features/auth/contracts'

export const updateProfileRequestSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e sublinhado')
    .optional(),
  email: z.email().optional(),
  bio: z.string().trim().max(240).nullable().optional(),
})

export const updateAvatarRequestSchema = z.object({
  avatarUrl: z.string().min(1).max(500_000),
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres')
    .max(72, 'A senha deve ter no máximo 72 caracteres'),
})

export const profileResponseSchema = userProfileSchema

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
export type UpdateAvatarRequest = z.infer<typeof updateAvatarRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
