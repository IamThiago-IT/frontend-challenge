export function stableStringify(value: unknown) {
  return JSON.stringify(value, (_key, currentValue: unknown) => {
    if (currentValue !== null && typeof currentValue === 'object' && !Array.isArray(currentValue)) {
      return Object.keys(currentValue)
        .sort()
        .reduce<Record<string, unknown>>((result, key) => {
          result[key] = (currentValue as Record<string, unknown>)[key]
          return result
        }, {})
    }

    return currentValue
  })
}
