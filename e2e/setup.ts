import { test as base, expect, type Page } from '@playwright/test'

/**
 * Fixture de base : ouvre l'accueil et attend le chargement de l'app.
 * baseURL se termine par /Argent_de-_poche/ donc les navigations utilisent
 * des chemins RELATIFS (sans slash initial) : goto('settings'), goto('stats')…
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // domcontentloaded : ne pas attendre le script Google externe (bloqué en
    // environnement de test) pour l'événement load.
    await page.goto('', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('text=Argent de Poche', { timeout: 15000 })
    await use(page)
  },
})

export { expect }

const TEST_PIN = '1234'

/**
 * Passe en mode parent de façon déterministe : installe un hash de PIN connu
 * dans IndexedDB puis saisit ce PIN. Évite la dépendance à Google Auth pour la
 * première configuration.
 */
export async function enterParentMode(page: Page): Promise<void> {
  await page.evaluate(async (pin) => {
    const enc = new TextEncoder().encode(pin)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    const hash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('ArgentDePocheDB')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('settings', 'readwrite')
        const store = tx.objectStore('settings')
        const getReq = store.index('key').get('pin_hash')
        getReq.onsuccess = () => {
          if (getReq.result) {
            store.put({ ...getReq.result, value: hash })
          } else {
            store.add({ key: 'pin_hash', value: hash })
          }
        }
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, TEST_PIN)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=Argent de Poche', { timeout: 15000 })

  await page.getByRole('button', { name: 'Mode Parent' }).click()
  for (const digit of TEST_PIN.split('')) {
    await page.getByRole('button', { name: `Chiffre ${digit}`, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Valider' }).click()
  // Attendre l'apparition du badge "Mode Parent" (barre supérieure)
  await expect(page.getByText('Mode Parent', { exact: true })).toBeVisible()
}
