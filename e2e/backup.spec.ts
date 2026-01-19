import { test, expect, enterParentMode } from './setup'

test.describe('Backup et Restauration', () => {
  test.beforeEach(async ({ page }) => {
    await enterParentMode(page)
    // Naviguer vers les parametres
    await page.goto('/settings')
  })

  test('affiche la section Export', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Exporter les donnees' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exporter' })).toBeVisible()
  })

  test('affiche la section Google Drive', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Google Drive' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Connexion Google' })).toBeVisible()
  })

  test('affiche la section Import', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Importer un backup' })).toBeVisible()
    await expect(page.getByLabel('Fichier JSON')).toBeVisible()
  })

  test('le bouton Importer est desactive sans fichier', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Importer' })).toBeDisabled()
  })

  test('affiche le selecteur de mode d\'import', async ({ page }) => {
    await expect(page.getByLabel(/Mode d'import/)).toBeVisible()
  })
})
