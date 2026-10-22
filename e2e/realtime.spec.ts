import { expect, test } from '@playwright/test'

import {
  addNftToCart,
  emitNftEvent,
  gotoApp,
  loginAsAna,
  setScenario,
  waitForSocket,
} from './helpers'

test('atualiza o catálogo e ignora eventos duplicados ou repetidos', async ({ page }) => {
  await gotoApp(page, '/')
  const card = page.getByTestId('nft-card').filter({ hasText: 'Ritmo Circular' })
  await expect(card).toContainText('0.85 ETH')

  await waitForSocket(page)
  await setScenario(page, { emitDuplicates: true })
  await emitNftEvent(page, { nftId: 'nft-002', priceEth: '0.91' })

  await expect(card).toContainText('0.91 ETH')

  const replay = await page.evaluate(async () => {
    const response = await fetch('/__mocks__/events/replay', { method: 'POST' })

    if (!response.ok) {
      throw new Error(`Falha ao repetir eventos: ${response.status}`)
    }

    return (await response.json()) as { count: number }
  })

  expect(replay.count).toBeGreaterThan(0)
  await expect(card).toContainText('0.91 ETH')
  await expect(page.getByText('0.93 ETH')).toHaveCount(0)
})

test('sincroniza indisponibilidade com o carrinho em tempo real', async ({ page }) => {
  await loginAsAna(page)
  await addNftToCart(page)
  await gotoApp(page, '/cart')

  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('1')
  await waitForSocket(page)
  await emitNftEvent(page, { nftId: 'nft-002', availability: 'sold_out' })

  await expect(page.getByText('Indisponível', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Aumentar quantidade de Ritmo Circular' }),
  ).toBeDisabled()
})
