import { apiRequest, apiRequestVoid } from '@/lib/api/request'
import {
  changePasswordRequestSchema,
  profileResponseSchema,
  updateAvatarRequestSchema,
  updateProfileRequestSchema,
  type ChangePasswordRequest,
  type UpdateAvatarRequest,
  type UpdateProfileRequest,
} from '@/features/profile/contracts'

export function getProfile(signal?: AbortSignal) {
  return apiRequest(profileResponseSchema, {
    method: 'GET',
    url: '/profile',
    signal,
  })
}

export function updateProfile(input: UpdateProfileRequest) {
  const body = updateProfileRequestSchema.parse(input)

  return apiRequest(profileResponseSchema, {
    method: 'PATCH',
    url: '/profile',
    data: body,
  })
}

export function updateAvatar(input: UpdateAvatarRequest) {
  const body = updateAvatarRequestSchema.parse(input)

  return apiRequest(profileResponseSchema, {
    method: 'PUT',
    url: '/profile/avatar',
    data: body,
  })
}

export function changePassword(input: ChangePasswordRequest) {
  const body = changePasswordRequestSchema.parse(input)

  return apiRequestVoid({
    method: 'PUT',
    url: '/profile/password',
    data: body,
  })
}
