import { expect, test } from '@playwright/test'

import { gotoApp, loginAsAna, setScenario } from './helpers'

test('visitante é direcionado ao login e favorito persiste', async ({ page }) => {
  await gotoApp(page, '/nft/nft-002')

  const guestFavorite = page.getByRole('link', { name: 'Entrar para favoritar' })
  await expect(guestFavorite).toBeVisible()
  await guestFavorite.click()

  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('AnaNft#2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/nft\/nft-002$/)
  const favoriteButton = page.getByTestId('favorite-toggle')
  await expect(favoriteButton).toContainText('Favoritar')
  await favoriteButton.click()

  await expect(favoriteButton).toContainText('Favoritado')
  await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await expect(page.getByTestId('favorite-toggle')).toContainText('Favoritado')
})

test('carrega favoritos existentes e permite desfavoritar', async ({ page }) => {
  await loginAsAna(page)
  await gotoApp(page, '/nft/nft-003')

  const favoriteButton = page.getByTestId('favorite-toggle')
  await expect(favoriteButton).toContainText('Favoritado')

  await favoriteButton.click()
  await expect(favoriteButton).toContainText('Favoritar')
  await page.reload()
  await expect(page.getByTestId('favorite-toggle')).toContainText('Favoritar')
})

test('reverte o favorito quando a API falha', async ({ page }) => {
  await loginAsAna(page)
  await gotoApp(page, '/nft/nft-002')
  await expect(page.getByRole('heading', { level: 1, name: 'Ritmo Circular' })).toBeVisible()

  await setScenario(page, {
    failure: {
      status: 503,
      code: 'TRANSIENT_ERROR',
      message: 'Falha simulada ao favoritar.',
      pathIncludes: '/favorites/',
      remaining: 1,
    },
  })

  const favoriteButton = page.getByTestId('favorite-toggle')
  await favoriteButton.click()

  await expect(page.getByText('Falha simulada ao favoritar.')).toBeVisible()
  await expect(favoriteButton).toContainText('Favoritar')
  await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false')
})
