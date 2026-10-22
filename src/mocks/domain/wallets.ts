import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  Wallet,
  WalletConnection,
} from '@/features/wallets/contracts'
import { getMockDb, mutateMockDb, nextMockId } from '@/mocks/db'
import { MockRequestError } from '@/mocks/http'
import { maxWallets } from '@/mocks/domain/serializers'
import { nowIso } from '@/mocks/domain/time'

function ensureWalletLimit(wallets: Wallet[]) {
  if (wallets.length >= maxWallets) {
    throw new MockRequestError(
      409,
      'WALLET_LIMIT_EXCEEDED',
      `Você pode cadastrar no máximo ${maxWallets} carteiras.`,
    )
  }
}

function ensureUniqueAddress(wallets: Wallet[], address: string, walletId?: string) {
  if (
    wallets.some(
      (wallet) => wallet.id !== walletId && wallet.address.toLowerCase() === address.toLowerCase(),
    )
  ) {
    throw new MockRequestError(409, 'WALLET_CONFLICT', 'Este endereço já está cadastrado.')
  }
}

function setPrimary(wallets: Wallet[], walletId: string) {
  wallets.forEach((wallet) => {
    wallet.isPrimary = wallet.id === walletId
  })
}

export function getWallets(userId: string) {
  const items = getMockDb().wallets[userId] ?? []

  return {
    items,
    maxWallets,
  }
}

export function createWallet(userId: string, input: CreateWalletRequest): Wallet {
  return mutateMockDb((db) => {
    const wallets = db.wallets[userId] ?? []
    ensureWalletLimit(wallets)
    ensureUniqueAddress(wallets, input.address)

    const timestamp = nowIso()
    const wallet: Wallet = {
      id: nextMockId(db, 'wallet'),
      label: input.label,
      address: input.address,
      network: input.network,
      isPrimary: wallets.length === 0 || input.isPrimary === true,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
    }

    if (wallet.isPrimary) {
      setPrimary(wallets, wallet.id)
    }

    db.wallets[userId] = [...wallets, wallet]

    return wallet
  })
}

export function connectWallet(
  userId: string,
  walletId: string,
  network: Wallet['network'],
): WalletConnection {
  const wallet = (getMockDb().wallets[userId] ?? []).find((candidate) => candidate.id === walletId)

  if (!wallet) {
    throw new MockRequestError(404, 'NOT_FOUND', 'Carteira não encontrada.')
  }

  if (wallet.network !== network) {
    throw new MockRequestError(
      422,
      'VALIDATION_ERROR',
      'A rede informada não corresponde à carteira selecionada.',
    )
  }

  return {
    walletId: wallet.id,
    address: wallet.address,
    network: wallet.network,
    connectedAt: nowIso(),
  }
}

export function updateWallet(userId: string, walletId: string, input: UpdateWalletRequest): Wallet {
  return mutateMockDb((db) => {
    const wallets = db.wallets[userId] ?? []
    const wallet = wallets.find((candidate) => candidate.id === walletId)

    if (!wallet) {
      throw new MockRequestError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    }

    if (input.address) {
      ensureUniqueAddress(wallets, input.address, walletId)
      wallet.address = input.address
    }

    if (input.isPrimary === false && wallet.isPrimary) {
      throw new MockRequestError(
        422,
        'VALIDATION_ERROR',
        'Defina outra carteira como principal antes de remover esta função.',
      )
    }

    if (input.label !== undefined) {
      wallet.label = input.label
    }

    if (input.network !== undefined) {
      wallet.network = input.network
    }

    if (input.isPrimary === true) {
      setPrimary(wallets, wallet.id)
    }

    wallet.version += 1
    wallet.updatedAt = nowIso()

    return wallet
  })
}
