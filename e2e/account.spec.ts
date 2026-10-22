import { expect, test } from '@playwright/test'

import { gotoApp } from './helpers'

test('protege rotas privadas e retorna ao destino após login', async ({ page }) => {
  await gotoApp(page, '/wallets')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('AnaNft#2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/wallets$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Carteiras' })).toBeVisible()
})

test('exibe credenciais inválidas e permite entrar com a conta de demonstração', async ({
  page,
}) => {
  await gotoApp(page, '/login')
  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('senha-errada')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos.')

  await page.getByRole('button', { name: 'Usar conta de demonstração' }).click()
  await expect(page.getByLabel('E-mail')).toHaveValue('ana@nft.test')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
})

test('cria uma conta, encerra a sessão e entra novamente', async ({ page }) => {
  const email = `e2e-${Date.now()}@nft.test`

  await gotoApp(page, '/register')
  await page.getByLabel('Nome').fill('Conta E2E')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill('ContaE2E#2026')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()

  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Perfil' })).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

  await gotoApp(page, '/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill('ContaE2E#2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
})
