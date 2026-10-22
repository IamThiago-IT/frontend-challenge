import { http } from 'msw'

import {
  connectWalletRequestSchema,
  createWalletRequestSchema,
  updateWalletRequestSchema,
} from '@/features/wallets/contracts'
import { connectWallet, createWallet, getWallets, updateWallet } from '@/mocks/domain/wallets'
import {
  jsonData,
  mockApiPath,
  mockHandler,
  readJson,
  requireAuthenticatedActor,
} from '@/mocks/http'

export const walletsHandlers = [
  http.get(
    mockApiPath('/wallets'),
    mockHandler(({ request }) => {
      const actor = requireAuthenticatedActor(request)

      return jsonData(getWallets(actor.user.id))
    }),
  ),
  http.post(
    mockApiPath('/wallets'),
    mockHandler(async ({ request }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, createWalletRequestSchema)

      return jsonData(createWallet(actor.user.id, input), 201)
    }),
  ),
  http.post(
    mockApiPath('/wallets/:walletId/connect'),
    mockHandler(async ({ request, params }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, connectWalletRequestSchema)

      return jsonData(connectWallet(actor.user.id, String(params.walletId), input.network))
    }),
  ),
  http.patch(
    mockApiPath('/wallets/:walletId'),
    mockHandler(async ({ request, params }) => {
      const actor = requireAuthenticatedActor(request)
      const input = await readJson(request, updateWalletRequestSchema)

      return jsonData(updateWallet(actor.user.id, String(params.walletId), input))
    }),
  ),
]
