import { bytesToHex } from '@/lib/crypto/encoding'

export async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)

  return bytesToHex(new Uint8Array(digest))
}
