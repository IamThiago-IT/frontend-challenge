export const ETH_DECIMALS = 18
export const WEI_PER_ETH = 10n ** 18n
export const BASIS_POINTS = 10_000n
export const ethAmountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/

export function isEthAmount(value: string) {
  return ethAmountPattern.test(value)
}

export function parseEthToWei(value: string) {
  if (!isEthAmount(value)) {
    throw new Error(`Invalid ETH amount: ${value}`)
  }

  const [whole = '0', fraction = ''] = value.split('.')

  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(ETH_DECIMALS, '0') || '0')
}

export function toEthString(wei: bigint) {
  if (wei < 0n) {
    throw new Error('ETH amounts cannot be negative')
  }

  const whole = wei / WEI_PER_ETH
  const fraction = wei % WEI_PER_ETH

  if (fraction === 0n) {
    return whole.toString()
  }

  return `${whole}.${fraction.toString().padStart(ETH_DECIMALS, '0').replace(/0+$/, '')}`
}

export function addEth(...values: string[]) {
  return toEthString(values.reduce((total, value) => total + parseEthToWei(value), 0n))
}

export function subtractEth(value: string, subtract: string) {
  const result = parseEthToWei(value) - parseEthToWei(subtract)

  if (result < 0n) {
    throw new Error('ETH subtraction would produce a negative amount')
  }

  return toEthString(result)
}

export function multiplyEthByInteger(value: string, multiplier: number) {
  if (!Number.isInteger(multiplier) || multiplier < 0) {
    throw new Error('Multiplier must be a non-negative integer')
  }

  return toEthString(parseEthToWei(value) * BigInt(multiplier))
}

export function applyBasisPoints(value: string, basisPoints: number) {
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000) {
    throw new Error('Basis points must be an integer between 0 and 10000')
  }

  return toEthString((parseEthToWei(value) * BigInt(basisPoints)) / BASIS_POINTS)
}

export function compareEth(left: string, right: string) {
  const leftWei = parseEthToWei(left)
  const rightWei = parseEthToWei(right)

  if (leftWei === rightWei) {
    return 0
  }

  return leftWei > rightWei ? 1 : -1
}
