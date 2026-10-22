import type { MockUser } from '@/mocks/db/schema'

export const seedUsers: MockUser[] = [
  {
    id: 'user-ana',
    name: 'Ana Silva',
    email: 'ana@nft.test',
    username: 'anasilva',
    avatarUrl: '/mock-assets/avatar-ana.svg',
    bio: 'Colecionadora de arte digital e fotografia urbana.',
    joinedAt: '2025-01-12T10:00:00.000Z',
    passwordSalt: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    passwordHash: '33b24e181f19ebbfdb1ad8f224e9b4e0df1cd77a041a9caae71aceeeef82571c',
  },
  {
    id: 'user-bruno',
    name: 'Bruno Costa',
    email: 'bruno@nft.test',
    username: 'brunocosta',
    avatarUrl: '/mock-assets/avatar-bruno.svg',
    bio: 'Entusiasta de metaverso, esportes e edições raras.',
    joinedAt: '2025-03-08T15:30:00.000Z',
    passwordSalt: '0f1e2d3c4b5a69788796a5b4c3d2e1f0',
    passwordHash: 'a74c32de55db8f8919d661c6866c3b81396e6d5667aed38ee5cf7006cbaa8354',
  },
]
