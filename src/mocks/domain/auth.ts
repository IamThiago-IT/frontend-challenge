import { bytesToHex } from '@/lib/crypto/encoding'
import { createPasswordSalt, hashPassword, verifyPassword } from '@/lib/crypto/password'
import { getMockDb, mutateMockDb } from '@/mocks/db'
import type { MockDb, MockSession, MockUser } from '@/mocks/db/schema'
import { MockRequestError } from '@/mocks/http'
import { nowIso } from '@/mocks/domain/time'
import { toPublicUser } from '@/mocks/domain/serializers'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SessionResponse,
} from '@/features/auth/contracts'
import type { Wallet } from '@/features/wallets/contracts'

function randomHex(byteLength: number) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteLength)))
}

function createToken() {
  return `token_${randomHex(32)}`
}

function createWallet(seedId: string): Wallet {
  const timestamp = nowIso()

  return {
    id: `wallet-${seedId}-${randomHex(4)}`,
    label: 'Carteira principal',
    address: `0x${randomHex(20)}`,
    network: 'ethereum',
    isPrimary: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function usernameBase(email: string) {
  const localPart = normalizeEmail(email).split('@')[0] ?? ''
  const normalized = localPart.replace(/[^a-z0-9_]/g, '').slice(0, 24)

  return normalized.length >= 3 ? normalized : `collector${randomHex(2)}`
}

function uniqueUsername(db: MockDb, email: string) {
  const base = usernameBase(email)
  let candidate = base.slice(0, 32)
  let suffix = 1

  while (db.users.some((user) => user.username === candidate)) {
    const suffixText = String(suffix)
    candidate = `${base.slice(0, 32 - suffixText.length)}${suffixText}`
    suffix += 1
  }

  return candidate
}

function createSession(db: MockDb, userId: string): MockSession {
  const createdAt = nowIso()
  const ttl = Math.max(db.scenario.sessionTtlMs, 1)
  const session: MockSession = {
    token: createToken(),
    userId,
    createdAt,
    expiresAt: new Date(Date.parse(createdAt) + ttl).toISOString(),
  }

  db.sessions = [...db.sessions.filter((item) => Date.parse(item.expiresAt) > Date.now()), session]

  return session
}

function authResponse(user: MockUser, session: MockSession): AuthResponse {
  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: toPublicUser(user),
  }
}

export async function loginUser(input: LoginRequest): Promise<AuthResponse> {
  const db = getMockDb()
  const user = db.users.find((candidate) => candidate.email === normalizeEmail(input.email))

  if (!user || !(await verifyPassword(input.password, user.passwordSalt, user.passwordHash))) {
    throw new MockRequestError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.')
  }

  return mutateMockDb((draft) => {
    const freshUser = draft.users.find((candidate) => candidate.id === user.id)

    if (!freshUser) {
      throw new MockRequestError(401, 'INVALID_CREDENTIALS', 'Usuário não encontrado.')
    }

    return authResponse(freshUser, createSession(draft, freshUser.id))
  })
}

export async function registerUser(input: RegisterRequest): Promise<AuthResponse> {
  const email = normalizeEmail(input.email)
  const existingUser = getMockDb().users.find((user) => user.email === email)

  if (existingUser) {
    throw new MockRequestError(409, 'EMAIL_ALREADY_EXISTS', 'Já existe uma conta com este e-mail.')
  }

  const salt = createPasswordSalt()
  const passwordHash = await hashPassword(input.password, salt)
  const timestamp = nowIso()

  return mutateMockDb((db) => {
    if (db.users.some((user) => user.email === email)) {
      throw new MockRequestError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Já existe uma conta com este e-mail.',
      )
    }

    const user: MockUser = {
      id: `user-${randomHex(6)}`,
      name: input.name.trim(),
      email,
      username: uniqueUsername(db, email),
      avatarUrl: null,
      bio: null,
      joinedAt: timestamp,
      passwordSalt: salt,
      passwordHash,
    }

    db.users.push(user)
    db.wallets[user.id] = [createWallet(db.seedId)]

    return authResponse(user, createSession(db, user.id))
  })
}

export function logoutSession(token: string) {
  mutateMockDb((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token)
  })
}

export function sessionResponse(user: MockUser, expiresAt: string): SessionResponse {
  return {
    user: toPublicUser(user),
    expiresAt,
  }
}
