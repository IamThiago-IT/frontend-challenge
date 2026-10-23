import { expect, test, type Page } from '@playwright/test'

const draftStorageKey = 'nft-marketplace:checkout:draft:user-ana'

async function loginAsAna(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('AnaNft#2026')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /SEJA DONO/ })).toBeVisible()
}

async function addItemToCart(page: Page) {
  await page.goto('/nft/nft-002')
  await expect(page.getByRole('heading', { level: 1, name: 'Ritmo Circular' })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
}

async function goToReview(page: Page) {
  await page.goto('/cart')
  await expect(page.getByRole('heading', { level: 1, name: 'Carrinho' })).toBeVisible()
  await page.getByRole('link', { name: 'Ir para o checkout' }).click()
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar para revisão' }).click()
  await expect(page.getByRole('heading', { name: 'Revisar pedido' })).toBeVisible()
  await expect(page.getByTestId('checkout-review')).toBeVisible()
}

test('finaliza uma compra confirmada e limpa o carrinho', async ({ page }) => {
  await loginAsAna(page)
  await addItemToCart(page)

  await page.goto('/cart')
  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('1')
  await page.getByRole('button', { name: 'Aumentar quantidade de Ritmo Circular' }).click()
  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('2')

  await goToReview(page)
  await page.getByLabel(/Revisei os itens/).check()

  await page.evaluate(async () => {
    const response = await fetch('/__mocks__/events/nft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nftId: 'nft-002', priceEth: '0.9' }),
    })

    if (!response.ok) {
      throw new Error(`Falha ao alterar o NFT: ${response.status}`)
    }
  })

  await expect(page.getByText(/O resumo foi atualizado por uma alteração de preço/)).toBeVisible()
  await expect(page.getByLabel(/Revisei os itens/)).not.toBeChecked()
  await page.getByLabel(/Revisei os itens/).check()

  await page.getByTestId('checkout-confirm').click()

  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByTestId('order-status')).toContainText('Confirmado', {
    timeout: 10_000,
  })
  await expect(page.getByTestId('order-receipt')).toBeVisible()

  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})

test('exibe pagamento recusado e preserva os itens do carrinho', async ({ page }) => {
  await loginAsAna(page)
  await addItemToCart(page)

  await page.evaluate(async () => {
    const response = await fetch('/__mocks__/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentResult: 'declined', paymentDelayMs: 100 }),
    })

    if (!response.ok) {
      throw new Error(`Falha ao configurar cenário: ${response.status}`)
    }
  })

  await goToReview(page)
  await page.getByLabel(/Revisei os itens/).check()
  await page.getByTestId('checkout-confirm').click()

  await expect(page).toHaveURL(/\/orders\/order-/)
  await expect(page.getByTestId('order-status')).toContainText('Recusado', {
    timeout: 10_000,
  })
  await expect(page.getByText('Pagamento recusado', { exact: true })).toBeVisible()
  await expect(page.getByTestId('order-receipt')).toHaveCount(0)

  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page.getByTestId('cart-quantity-nft-002')).toHaveText('1')
})

test('recupera um pedido já criado sem duplicar a compra', async ({ page }) => {
  await loginAsAna(page)
  await addItemToCart(page)

  const result = await page.evaluate(async () => {
    const token = localStorage.getItem('nft-marketplace:session-token')

    if (!token) {
      throw new Error('Sessão ausente')
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
    const quoteResponse = await fetch('/api/quote', {
      method: 'POST',
      headers,
      body: JSON.stringify({ walletId: 'wallet-ana-primary', network: 'ethereum' }),
    })

    if (!quoteResponse.ok) {
      throw new Error(`Falha na cotação: ${quoteResponse.status}`)
    }

    const quote = (await quoteResponse.json()) as {
      id: string
      walletId: string
      network: string
    }
    const idempotencyKey = `order:user-ana:${quote.id}-recovery`
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        quoteId: quote.id,
        walletId: quote.walletId,
        network: quote.network,
        collector: { name: 'Ana Silva', email: 'ana@nft.test' },
      }),
    })

    if (!orderResponse.ok) {
      throw new Error(`Falha ao criar pedido: ${orderResponse.status}`)
    }

    const order = (await orderResponse.json()) as { id: string }
    sessionStorage.setItem(
      'nft-marketplace:checkout:attempt:user-ana',
      JSON.stringify({
        quoteId: quote.id,
        walletId: quote.walletId,
        network: quote.network,
        collector: { name: 'Ana Silva', email: 'ana@nft.test' },
        idempotencyKey,
        createdAt: new Date().toISOString(),
      }),
    )

    return { orderId: order.id }
  })

  await page.goto('/checkout')
  await expect(page.getByTestId('checkout-recovery')).toBeVisible()
  await page.getByRole('button', { name: 'Verificar pedido' }).click()

  await expect(page).toHaveURL(new RegExp(`/orders/${result.orderId}$`))
  const orders = await page.evaluate(async () => {
    const response = await fetch('/__mocks__/state')
    return (await response.json()) as { orders: Array<{ id: string }> }
  })

  expect(orders.orders).toHaveLength(2)
})

test('preserva o rascunho após expirar a sessão', async ({ page }) => {
  await loginAsAna(page)
  await addItemToCart(page)
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Ir para o checkout' }).click()
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()

  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada')).toBeVisible()

  const nameInput = page.getByLabel('Nome')
  await nameInput.fill('Ana Persistente')

  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), draftStorageKey))
    .toContain('Ana Persistente')

  await page.evaluate(async () => {
    const response = await fetch('/__mocks__/session/expire', { method: 'POST' })

    if (!response.ok) {
      throw new Error(`Falha ao expirar sessão: ${response.status}`)
    }
  })

  // A sessão expirada pode ser detectada em background (refetch 401 → redirect para
  // /login) antes ou durante o clique; ambos os caminhos são válidos, por isso o
  // clique não deve falhar o teste se a navegação já tiver acontecido.
  await page
    .getByRole('button', { name: 'Continuar para revisão' })
    .click({ timeout: 3_000 })
    .catch(() => undefined)
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('AnaNft#2026')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByLabel('Nome')).toHaveValue('Ana Persistente')
  await expect(page.getByTestId('checkout-recovery')).toHaveCount(0)
})
