import { test, expect } from './setup'

test.describe('Authentification et Modes', () => {
  test.describe('Mode Enfant (par defaut)', () => {
    test('demarre en mode enfant', async ({ page }) => {
      // En mode enfant, pas de bouton d'ajout
      await expect(page.locator('button:has-text("+")')).not.toBeVisible()
    })

    test('ne peut pas acceder aux parametres directement', async ({ page }) => {
      await page.goto('/settings')
      // Devrait etre redirige vers le dashboard
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Transition Mode Parent', () => {
    test('appui long sur le titre active le mode parent', async ({ page }) => {
      const title = page.getByRole('heading', { name: 'Argent de Poche' })

      // Appui long (2.5 secondes)
      await title.click({ delay: 2500 })

      // Le bouton + devrait apparaitre ou le PIN pad
      const plusButton = page.locator('button:has-text("+")')
      const pinPad = page.locator('[data-testid="pin-pad"]')

      // L'un ou l'autre doit etre visible
      const isParentMode = await plusButton.isVisible().catch(() => false)
      const isPinPadVisible = await pinPad.isVisible().catch(() => false)

      expect(isParentMode || isPinPadVisible).toBeTruthy()
    })
  })
})

test.describe('Navigation', () => {
  test('navigue vers la page d\'aide', async ({ page }) => {
    await page.goto('/help')
    await expect(page.getByRole('heading', { name: 'Aide' })).toBeVisible()
  })

  test('navigue vers les statistiques', async ({ page }) => {
    await page.goto('/stats')
    await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  })
})
