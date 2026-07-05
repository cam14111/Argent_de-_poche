import { test, expect, enterParentMode } from './setup'

test.describe('Authentification et Modes', () => {
  test.describe('Mode Enfant (par defaut)', () => {
    test('demarre en mode enfant', async ({ page }) => {
      // En mode enfant, pas de bouton d'ajout de transaction
      await expect(
        page.getByRole('button', { name: 'Ajouter une transaction' })
      ).not.toBeVisible()
    })

    test('affiche le bouton pour passer en mode parent', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Mode Parent' })).toBeVisible()
    })
  })

  test.describe('Transition Mode Parent', () => {
    test('le PIN débloque le mode parent', async ({ page }) => {
      await enterParentMode(page)
      // Le bouton flottant d'ajout apparaît en mode parent
      await expect(
        page.getByRole('button', { name: 'Ajouter une transaction' })
      ).toBeVisible()
    })
  })
})

test.describe('Navigation', () => {
  test("navigue vers la page d'aide", async ({ page }) => {
    await page.goto('help', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Aide' })).toBeVisible()
  })

  test('navigue vers les statistiques', async ({ page }) => {
    await page.goto('stats', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  })
})
