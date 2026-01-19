import { test, expect } from './setup'

test.describe('Dashboard', () => {
  test('affiche le titre de l\'application', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Argent de Poche' })).toBeVisible()
  })

  test('affiche le solde total', async ({ page }) => {
    await expect(page.getByText('Solde total')).toBeVisible()
  })

  test('affiche la section Comptes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Comptes' })).toBeVisible()
  })

  test('le lien vers les statistiques est visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Voir les statistiques' })).toBeVisible()
  })

  test('navigue vers les statistiques', async ({ page }) => {
    await page.click('text=Voir les statistiques')
    await expect(page).toHaveURL(/\/stats/)
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  })
})
