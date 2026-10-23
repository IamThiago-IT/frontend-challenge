import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { SearchDisclosureContext } from '@/app/search-disclosure-context'

export function SearchDisclosureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => setIsOpen((previous) => !previous), [])
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({
      isOpen,
      toggle,
      open,
      close,
    }),
    [isOpen, toggle, open, close],
  )

  return (
    <SearchDisclosureContext.Provider value={value}>{children}</SearchDisclosureContext.Provider>
  )
}
