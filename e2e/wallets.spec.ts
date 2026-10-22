import { expect, test } from '@playwright/test'

import { gotoApp, loginAsAna } from './helpers'

const newAddress = '0x1111111111111111111111111111111111111111'
const duplicateAddress = '0x8f3c2a91d4b7e6509c1f8a2b3d4e5f60718293a4'

test('cria, edita e define uma carteira como principal', async ({ page }) => {
  await loginAsAna(page)
  await gotoApp(page, '/wallets')
  await expect(page.getByText('2 de 5 carteiras cadastradas.')).toBeVisible()

  await page.getByTestId('wallet-label').fill('Carteira E2E')
  await page.getByTestId('wallet-network').selectOption('base')
  await page.getByTestId('wallet-address').fill(newAddress)
  await page.getByTestId('wallet-primary').check()
  await page.getByTestId('wallet-submit').click()

  await expect(page.getByText('Carteira adicionada.', { exact: true })).toBeVisible()
  await expect(page.getByText('3 de 5 carteiras cadastradas.')).toBeVisible()

  const createdRow = page.getByTestId(/^wallet-row-/).filter({ hasText: 'Carteira E2E' })
  await expect(createdRow).toContainText('Principal')
  await createdRow.getByRole('button', { name: 'Editar' }).click()

  await expect(page.getByTestId('wallet-edit-form')).toBeVisible()
  await page.getByTestId('wallet-label').fill('Carteira E2E editada')
  await page.getByTestId('wallet-network').selectOption('polygon')
  await page.getByTestId('wallet-submit').click()

  await expect(page.getByText('Carteira atualizada.', { exact: true })).toBeVisible()
  await expect(
    page.getByTestId(/^wallet-row-/).filter({ hasText: 'Carteira E2E editada' }),
  ).toContainText('Polygon')

  await page.getByTestId('wallet-primary-wallet-ana-primary').click()
  await expect(page.getByTestId('wallet-row-wallet-ana-primary')).toContainText('Principal')
  await expect(
    page.getByTestId(/^wallet-row-/).filter({ hasText: 'Carteira E2E editada' }),
  ).not.toContainText('Principal')
})

test('impede endereço duplicado e respeita o limite de carteiras', async ({ page }) => {
  await loginAsAna(page)
  await gotoApp(page, '/wallets')

  await page.getByTestId('wallet-label').fill('Endereço duplicado')
  await page.getByTestId('wallet-network').selectOption('ethereum')
  await page.getByTestId('wallet-address').fill(duplicateAddress)
  await page.getByTestId('wallet-submit').click()

  await expect(page.getByText('Este endereço já está cadastrado.').first()).toBeVisible()

  await page.evaluate(async () => {
    const token = localStorage.getItem('nft-marketplace:session-token')

    if (!token) {
      throw new Error('Sessão ausente')
    }

    for (const suffix of ['2', '3', '4']) {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: `Carteira extra ${suffix}`,
          address: `0x${suffix.repeat(40)}`,
          network: 'ethereum',
        }),
      })

      if (!response.ok) {
        throw new Error(`Falha ao criar carteira: ${response.status}`)
      }
    }
  })

  await page.reload()
  await expect(page.getByText('5 de 5 carteiras cadastradas.')).toBeVisible()
  await expect(page.getByText('Você atingiu o limite de 5 carteiras.')).toBeVisible()
})
