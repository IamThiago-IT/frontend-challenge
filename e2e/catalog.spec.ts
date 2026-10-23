import { expect, test } from '@playwright/test'

import { gotoApp } from './helpers'

test('busca, filtra, ordena e pagina o catálogo', async ({ page }) => {
  await gotoApp(page, '/')
  await expect(page.getByRole('heading', { level: 1, name: /SEJA DONO/ })).toBeVisible()

  const searchToggle = page.getByRole('button', { name: 'Alternar busca' })
  if (await searchToggle.isVisible()) {
    await searchToggle.click()
  }

  const search = page.getByLabel('Buscar NFTs')
  await search.fill('Ritmo Circular')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()

  await expect(page).toHaveURL(/q=Ritmo/)
  await expect(page.getByTestId('nft-card')).toHaveCount(1)
  await expect(page.getByTestId('nft-card')).toContainText('Ritmo Circular')

  await page.reload()
  await expect(page.getByLabel('Buscar NFTs')).toHaveValue('Ritmo Circular')
  await page.getByRole('button', { name: 'Limpar', exact: true }).click()
  await expect(page.getByTestId('nft-card').first()).toBeVisible()

  await page.getByRole('button', { name: /^Arte/ }).click()
  await expect(page).toHaveURL(/categories=.*art/)
  await expect(page.getByTestId('nft-card').first()).toBeVisible()

  await page.getByTestId('catalog-sort').selectOption('price-asc')
  await expect(page).toHaveURL(/sort=price-asc/)
  const prices = await page.getByTestId('nft-card').locator('.font-mono').allTextContents()
  const values = prices.map((price) => Number.parseFloat(price))
  expect(values).toEqual([...values].sort((left, right) => left - right))

  await page.getByRole('button', { name: 'Todas', exact: true }).click()
  await page.getByTestId('catalog-availability').selectOption('sold_out')
  await expect(page).toHaveURL(/availability=sold_out/)

  const cards = page.getByTestId('nft-card')
  const soldOutBadges = page.getByText('Esgotado', { exact: true })
  await expect(cards.first()).toBeVisible()
  expect(await soldOutBadges.count()).toBe(await cards.count())

  await page.getByTestId('catalog-availability').selectOption('')
  await page.getByTestId('catalog-featured').click()
  await expect(page.getByTestId('catalog-featured')).toBeChecked()
  await expect(page).toHaveURL(/featured=true/)
  await expect(page.getByTestId('nft-card').first()).toBeVisible()

  await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click()
  await expect(page.getByTestId('catalog-availability')).toHaveValue('')
  await expect(page.getByTestId('catalog-featured')).not.toBeChecked()

  await page.getByRole('button', { name: 'Próxima', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  await expect(page.getByText(/Página 2 de/)).toBeVisible()
})

test('abre o detalhe e trata NFT inexistente', async ({ page }) => {
  await gotoApp(page, '/')
  await page.getByTestId('nft-card').first().click()

  await expect(page).toHaveURL(/\/nft\/nft-/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Sobre esta obra')).toBeVisible()

  await page.goto('/nft/nft-inexistente')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await expect(page.getByText('404', { exact: true })).toBeVisible()
})
