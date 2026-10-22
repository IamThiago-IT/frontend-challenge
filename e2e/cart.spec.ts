import { expect, test } from '@playwright/test'

import { addNftToCart, gotoApp, loginAsAna } from './helpers'

test('mantém o carrinho do visitante, aplica cupom e mescla após login', async ({ page }) => {
  await addNftToCart(page)
  await gotoApp(page, '/cart')

  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('1')
  await expect(
    page.getByRole('button', { name: 'Diminuir quantidade de Ritmo Circular' }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Aumentar quantidade de Ritmo Circular' }).click()
  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('2')

  await page.getByLabel('Código do cupom').fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByText('Cupom inválido.')).toBeVisible()

  await page.getByLabel('Código do cupom').fill('BEMVINDO10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByText('Cupom aplicado.')).toBeVisible()
  await expect(page.getByText('BEMVINDO10', { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('2')
  await expect(page.getByText('BEMVINDO10', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Entrar para finalizar' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('AnaNft#2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/checkout$/)
  await gotoApp(page, '/cart')
  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('2')
})

test('remove itens do carrinho autenticado', async ({ page }) => {
  await loginAsAna(page)
  await addNftToCart(page)
  await gotoApp(page, '/cart')

  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('1')
  await page.getByRole('button', { name: 'Remover', exact: true }).click()

  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})
