import { expect, test } from '@playwright/test'

test('renderiza a página inicial', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/SEJA DONO/)
  await expect(page).toHaveTitle('NFT Marketplace')
})
