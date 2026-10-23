import { createContext, useContext } from 'react'

export type SearchDisclosureValue = {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

export const SearchDisclosureContext = createContext<SearchDisclosureValue | null>(null)

export function useSearchDisclosure() {
  const context = useContext(SearchDisclosureContext)

  if (!context) {
    throw new Error('useSearchDisclosure deve ser usado dentro de SearchDisclosureProvider')
  }

  return context
}
