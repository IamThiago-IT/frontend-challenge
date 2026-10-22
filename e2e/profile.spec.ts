import { expect, test } from '@playwright/test'

import { gotoApp, loginAsAna, setScenario } from './helpers'

test('atualiza dados, avatar e mantém o perfil após recarregar', async ({ page }) => {
  await loginAsAna(page)
  await gotoApp(page, '/profile')

  await page.getByTestId('profile-name').fill('Ana E2E')
  await page.getByTestId('profile-bio').fill('Bio atualizada pelo teste E2E.')
  await page.getByTestId('profile-save').click()

  await expect(page.getByTestId('profile-feedback')).toContainText('Perfil atualizado.')
  await page.reload()
  await expect(page.getByTestId('profile-name')).toHaveValue('Ana E2E')
  await expect(page.getByTestId('profile-bio')).toHaveValue('Bio atualizada pelo teste E2E.')

  await page.getByTestId('avatar-url').fill('/mock-assets/avatar-bruno.svg')
  await page.getByTestId('avatar-save').click()

  await expect(page.getByText('Avatar atualizado.', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Avatar de Ana E2E' })).toHaveAttribute(
    'src',
    '/mock-assets/avatar-bruno.svg',
  )
})

test('valida nome de usuário duplicado e troca a senha', async ({ page }) => {
  await loginAsAna(page)
  await gotoApp(page, '/profile')

  await page.getByTestId('profile-username').fill('brunocosta')
  await page.getByTestId('profile-save').click()
  await expect(page.getByText('Este nome de usuário já está em uso.').first()).toBeVisible()

  await page.getByTestId('profile-username').fill('anasilvae2e')
  await page.getByTestId('profile-save').click()
  await expect(page.getByTestId('profile-feedback')).toContainText('Perfil atualizado.')

  await page.getByTestId('password-current').fill('senha-incorreta')
  await page.getByTestId('password-new').fill('NovaSenha#2026')
  await page.getByTestId('password-confirm').fill('NovaSenha#2026')
  await page.getByTestId('password-save').click()
  await expect(page.getByText('A senha atual está incorreta.').first()).toBeVisible()

  await page.getByTestId('password-current').fill('AnaNft#2026')
  await page.getByTestId('password-save').click()
  await expect(page.getByText('Senha alterada.', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/$/)
  await gotoApp(page, '/login')
  await page.getByLabel('E-mail').fill('ana@nft.test')
  await page.getByLabel('Senha').fill('NovaSenha#2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
})

test('exibe erro de API e permite tentar novamente', async ({ page }) => {
  await loginAsAna(page)
  await setScenario(page, {
    failure: {
      status: 503,
      code: 'TRANSIENT_ERROR',
      message: 'Perfil indisponível.',
      pathIncludes: '/profile',
      remaining: 2,
    },
  })

  await gotoApp(page, '/profile')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar seu perfil.')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()

  await expect(page.getByTestId('profile-form')).toBeVisible()
})
