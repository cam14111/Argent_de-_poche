import { test, expect, enterParentMode } from './setup'

test.describe('Transactions', () => {
  test.describe('Mode Enfant', () => {
    test('ne montre pas le bouton d\'ajout de transaction', async ({ page }) => {
      // En mode enfant par defaut, le bouton + ne devrait pas etre visible
      await expect(page.locator('button:has-text("+")')).not.toBeVisible()
    })
  })

  test.describe('Mode Parent', () => {
    test.beforeEach(async ({ page }) => {
      await enterParentMode(page)
    })

    test('montre le bouton d\'ajout de transaction', async ({ page }) => {
      await expect(page.locator('button:has-text("+")')).toBeVisible()
    })

    test('navigue vers le formulaire d\'ajout', async ({ page }) => {
      await page.click('button:has-text("+")')
      await expect(page).toHaveURL(/\/transactions\/add/)
      await expect(page.getByText('Ajouter une transaction')).toBeVisible()
    })

    test('le formulaire contient les champs requis', async ({ page }) => {
      await page.click('button:has-text("+")')
      await expect(page.getByLabel('Profil enfant')).toBeVisible()
      await expect(page.getByLabel(/Montant/)).toBeVisible()
    })
  })
})

test.describe('Liste des transactions', () => {
  test('affiche les transactions d\'un profil', async ({ page }) => {
    // Cliquer sur un profil pour voir ses transactions
    const profileCard = page.locator('.cursor-pointer').first()

    if (await profileCard.isVisible()) {
      await profileCard.click()
      await expect(page).toHaveURL(/\/profiles\/\d+\/transactions/)
    }
  })
})
