export const catalogTabs = [
  { id: 'todos', label: 'Todos os NFTs' },
  { id: 'novos', label: 'Novos lançamentos' },
  { id: 'alta', label: 'Em alta' },
] as const

export type CatalogTabId = (typeof catalogTabs)[number]['id']
