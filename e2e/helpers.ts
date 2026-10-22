import { expect, type Page } from '@playwright/test'

export async function gotoApp(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() =>
    Boolean((window as unknown as { __APP_MOCKS_READY__?: boolean }).__APP_MOCKS_READY__),
  )
}

export async function loginAsAna(page: Page) {
  await gotoApp(page, '/login')
  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('AnaNft#2026')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Marketplace de NFTs' })).toBeVisible()
}

export async function setScenario(page: Page, patch: Record<string, unknown>) {
  await page.evaluate(async (scenario) => {
    const response = await fetch('/__mocks__/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario),
    })

    if (!response.ok) {
      throw new Error(`Falha ao configurar cenário: ${response.status}`)
    }
  }, patch)
}

export async function emitNftEvent(page: Page, input: Record<string, unknown>) {
  await page.evaluate(async (event) => {
    const response = await fetch('/__mocks__/events/nft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      throw new Error(`Falha ao emitir evento de NFT: ${response.status}`)
    }
  }, input)
}

export async function waitForSocket(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const response = await fetch('/__mocks__/state')

          if (!response.ok) {
            return 0
          }

          const state = (await response.json()) as { counts: { sockets: number } }

          return state.counts.sockets
        }),
      { timeout: 10_000 },
    )
    .toBeGreaterThan(0)
}

export async function addNftToCart(page: Page, nftId = 'nft-002') {
  await gotoApp(page, `/nft/${nftId}`)
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
}
