import type { Wallet } from '@/features/wallets/contracts'

export const seedWallets: Record<string, Wallet[]> = {
  'user-ana': [
    {
      id: 'wallet-ana-primary',
      label: 'Carteira principal',
      address: '0x8f3c2a91d4b7e6509c1f8a2b3d4e5f60718293a4',
      network: 'ethereum',
      isPrimary: true,
      createdAt: '2025-01-12T10:10:00.000Z',
      updatedAt: '2025-01-12T10:10:00.000Z',
      version: 1,
    },
    {
      id: 'wallet-ana-polygon',
      label: 'Carteira secundária',
      address: '0x2b7d4e91c3a5f6807d9e1b2c4a6f8e0d3c5b7a91',
      network: 'polygon',
      isPrimary: false,
      createdAt: '2025-05-20T09:30:00.000Z',
      updatedAt: '2025-05-20T09:30:00.000Z',
      version: 1,
    },
  ],
  'user-bruno': [
    {
      id: 'wallet-bruno-primary',
      label: 'Carteira principal',
      address: '0x6a1e9c3d5b7f2048a6c8e0f2d4b6a8c0e2f4d6b8',
      network: 'base',
      isPrimary: true,
      createdAt: '2025-03-08T15:40:00.000Z',
      updatedAt: '2025-03-08T15:40:00.000Z',
      version: 1,
    },
  ],
}
