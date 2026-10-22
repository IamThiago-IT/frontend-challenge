import { expect, test, type Page } from '@playwright/test'

import { addNftToCart, gotoApp, loginAsAna } from './helpers'

async function waitForStablePage(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    const visibleImages = Array.from(document.images).filter((image) => {
      const rect = image.getBoundingClientRect()

      return (
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      )
    })

    await Promise.all(
      visibleImages.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true })
              image.addEventListener('error', () => resolve(), { once: true })
            }),
      ),
    )
    window.scrollTo(0, 0)
  })
}

test('regressão visual da página inicial', async ({ page }) => {
  await gotoApp(page, '/')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()
  await waitForStablePage(page)
  await expect(page).toHaveScreenshot('inicio.png')
})

test('regressão visual do detalhe do NFT', async ({ page }) => {
  await gotoApp(page, '/nft/nft-002')
  await expect(page.getByRole('heading', { level: 1, name: 'Ritmo Circular' })).toBeVisible()
  await waitForStablePage(page)
  await expect(page).toHaveScreenshot('detalhe.png')
})

test('regressão visual do carrinho', async ({ page }) => {
  await addNftToCart(page)
  await gotoApp(page, '/cart')
  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('1')
  await waitForStablePage(page)
  await expect(page).toHaveScreenshot('carrinho.png')
})

test('regressão visual do pagamento', async ({ page }) => {
  await loginAsAna(page)
  await addNftToCart(page)
  await gotoApp(page, '/checkout')
  await expect(page.getByTestId('checkout-details')).toBeVisible()
  await expect(page.getByText('Carteira e rede')).toBeVisible()
  await waitForStablePage(page)
  await expect(page).toHaveScreenshot('pagamento.png')
})
