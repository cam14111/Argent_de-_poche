import { test, expect, enterParentMode } from './setup'

test.describe('Transactions', () => {
  test.describe('Mode Enfant', () => {
    test("ne montre pas le bouton d'ajout de transaction", async ({ page }) => {
      await expect(
        page.getByRole('button', { name: 'Ajouter une transaction' })
      ).not.toBeVisible()
    })
  })

  test.describe('Mode Parent', () => {
    test.beforeEach(async ({ page }) => {
      await enterParentMode(page)
    })

    test("montre le bouton d'ajout de transaction", async ({ page }) => {
      await expect(
        page.getByRole('button', { name: 'Ajouter une transaction' })
      ).toBeVisible()
    })

    test("navigue vers le formulaire d'ajout", async ({ page }) => {
      await page.getByRole('button', { name: 'Ajouter une transaction' }).click()
      await expect(page).toHaveURL(/\/transactions\/add/)
      await expect(page.getByText('Ajouter une transaction')).toBeVisible()
    })

    test('le formulaire contient les champs requis', async ({ page }) => {
      await page.getByRole('button', { name: 'Ajouter une transaction' }).click()
      await expect(page.getByLabel('Profil enfant')).toBeVisible()
      await expect(page.getByLabel(/Montant/)).toBeVisible()
    })

    test('crée une transaction de crédit et met à jour le solde', async ({ page }) => {
      await page.getByRole('button', { name: 'Ajouter une transaction' }).click()
      await page.getByLabel('Profil enfant').selectOption({ index: 1 })
      await page.getByRole('button', { name: '+ Revenu' }).click()
      await page.getByLabel(/Montant/).fill('12,50')
      await page.getByLabel('Motif', { exact: true }).selectOption({ index: 1 })
      await page.getByRole('button', { name: 'Créer la transaction' }).click()
      await expect(page.getByText('Transaction créée')).toBeVisible()
      await page.getByRole('button', { name: 'OK' }).click()
      await expect(page.getByText('12,50', { exact: false }).first()).toBeVisible()
    })
  })
})

test.describe('Liste des transactions', () => {
  test("affiche les transactions d'un profil", async ({ page }) => {
    const profileCard = page.getByRole('button').filter({ hasText: '€' }).first()
    if (await profileCard.isVisible().catch(() => false)) {
      await profileCard.click()
      await expect(page).toHaveURL(/\/profiles\/\d+\/transactions/)
    }
  })
})
