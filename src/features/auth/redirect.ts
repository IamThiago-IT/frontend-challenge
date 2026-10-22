export function toInternalRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value) {
    return fallback
  }

  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin

  try {
    const url = new URL(value, origin)

    if (url.origin !== origin) {
      return fallback
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return value.startsWith('/') && !value.startsWith('//') ? value : fallback
  }
}
