export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function hexToBytes(value: string) {
  if (!/^[0-9a-f]*$/i.test(value) || value.length % 2 !== 0) {
    throw new Error('Invalid hexadecimal value')
  }

  const bytes = new Uint8Array(value.length / 2)

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }

  return bytes
}
