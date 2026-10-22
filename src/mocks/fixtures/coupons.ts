import type { MockCoupon } from '@/mocks/db/schema'

export const seedCoupons: MockCoupon[] = [
  {
    code: 'BEMVINDO10',
    label: 'Boas-vindas: 10% de desconto',
    discountBps: 1_000,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    code: 'COLECIONADOR25',
    label: 'Colecionador: 25% de desconto',
    discountBps: 2_500,
    expiresAt: '2027-06-30T23:59:59.000Z',
  },
  {
    code: 'METAVERSO15',
    label: 'Semana do metaverso: 15% de desconto',
    discountBps: 1_500,
    expiresAt: '2027-03-31T23:59:59.000Z',
  },
  {
    code: 'EXPIRADO10',
    label: 'Campanha encerrada',
    discountBps: 1_000,
    expiresAt: '2025-01-01T00:00:00.000Z',
  },
]
