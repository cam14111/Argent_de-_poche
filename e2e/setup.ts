import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  // Reset l'application avant chaque test en supprimant IndexedDB
  page: async ({ page }, use) => {
    // Aller sur la page d'accueil
    await page.goto('/')

    // Attendre que l'application soit chargee
    await page.waitForSelector('text=Argent de Poche', { timeout: 10000 })

    await use(page)
  },
})

export { expect }

// Helpers
export async function enterParentMode(page: any) {
  // Appui long sur le titre pour passer en mode parent
  const title = page.getByRole('heading', { name: 'Argent de Poche' })
  await title.click({ delay: 2500 })

  // Si un dialog de PIN apparait, on attend qu'il soit visible
  const pinPad = page.locator('[data-testid="pin-pad"]')
  const isPinVisible = await pinPad.isVisible().catch(() => false)

  if (isPinVisible) {
    // Entrer un PIN par defaut (0000) pour le premier acces
    for (let i = 0; i < 4; i++) {
      await page.click('button:has-text("0")')
    }
  }
}

export async function navigateToSettings(page: any) {
  await enterParentMode(page)
  await page.click('text=Parametres')
}
