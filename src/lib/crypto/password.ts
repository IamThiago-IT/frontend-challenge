import { bytesToHex, hexToBytes } from '@/lib/crypto/encoding'

const ITERATIONS = 100_000
const KEY_LENGTH = 256

async function derivePasswordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: ITERATIONS,
      salt: hexToBytes(salt),
    },
    key,
    KEY_LENGTH,
  )

  return bytesToHex(new Uint8Array(bits))
}

export function createPasswordSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16))

  return bytesToHex(salt)
}

export function hashPassword(password: string, salt: string) {
  return derivePasswordHash(password, salt)
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const candidateHash = await derivePasswordHash(password, salt)

  return candidateHash === expectedHash
}
