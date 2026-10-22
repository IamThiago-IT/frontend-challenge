import type { UserProfile } from '@/features/auth/contracts'
import type {
  ChangePasswordRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/features/profile/contracts'
import { createPasswordSalt, hashPassword, verifyPassword } from '@/lib/crypto/password'
import { getMockDb, mutateMockDb } from '@/mocks/db'
import { MockRequestError } from '@/mocks/http'
import { toPublicUser } from '@/mocks/domain/serializers'

export function updateProfile(userId: string, input: UpdateProfileRequest): UserProfile {
  return mutateMockDb((db) => {
    const user = db.users.find((candidate) => candidate.id === userId)

    if (!user) {
      throw new MockRequestError(404, 'NOT_FOUND', 'Usuário não encontrado.')
    }

    if (input.email) {
      const normalizedEmail = input.email.trim().toLowerCase()
      const emailOwner = db.users.find(
        (candidate) => candidate.email === normalizedEmail && candidate.id !== userId,
      )

      if (emailOwner) {
        throw new MockRequestError(
          409,
          'EMAIL_ALREADY_EXISTS',
          'Já existe uma conta com este e-mail.',
        )
      }

      user.email = normalizedEmail
    }

    if (input.username) {
      const usernameOwner = db.users.find(
        (candidate) => candidate.username === input.username && candidate.id !== userId,
      )

      if (usernameOwner) {
        throw new MockRequestError(
          409,
          'VALIDATION_ERROR',
          'Este nome de usuário já está em uso.',
          {
            fieldErrors: {
              username: ['Este nome de usuário já está em uso.'],
            },
          },
        )
      }

      user.username = input.username
    }

    if (input.name !== undefined) {
      user.name = input.name
    }

    if (input.bio !== undefined) {
      user.bio = input.bio
    }

    return toPublicUser(user)
  })
}

export function updateAvatar(userId: string, input: UpdateAvatarRequest): UserProfile {
  return mutateMockDb((db) => {
    const user = db.users.find((candidate) => candidate.id === userId)

    if (!user) {
      throw new MockRequestError(404, 'NOT_FOUND', 'Usuário não encontrado.')
    }

    user.avatarUrl = input.avatarUrl

    return toPublicUser(user)
  })
}

export async function changePassword(userId: string, input: ChangePasswordRequest) {
  const user = getMockDb().users.find((candidate) => candidate.id === userId)

  if (!user) {
    throw new MockRequestError(404, 'NOT_FOUND', 'Usuário não encontrado.')
  }

  if (!(await verifyPassword(input.currentPassword, user.passwordSalt, user.passwordHash))) {
    throw new MockRequestError(422, 'VALIDATION_ERROR', 'A senha atual está incorreta.', {
      fieldErrors: {
        currentPassword: ['A senha atual está incorreta.'],
      },
    })
  }

  const salt = createPasswordSalt()
  const passwordHash = await hashPassword(input.newPassword, salt)

  mutateMockDb((db) => {
    const currentUser = db.users.find((candidate) => candidate.id === userId)

    if (currentUser) {
      currentUser.passwordSalt = salt
      currentUser.passwordHash = passwordHash
    }
  })
}
