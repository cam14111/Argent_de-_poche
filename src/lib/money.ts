/**
 * Utilitaires monétaires centralisés.
 * Tous les montants sont manipulés en euros mais arrondis au centime
 * pour éviter les dérives de virgule flottante (0.1 + 0.2 ≠ 0.3).
 */

/** Montant maximal autorisé pour une transaction (en euros). */
export const MAX_AMOUNT = 100_000

/** Arrondit un montant au centime le plus proche. */
export function roundCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

/**
 * Additionne une liste de montants en centimes pour rester exact.
 */
export function sumAmounts(amounts: number[]): number {
  const cents = amounts.reduce((acc, a) => acc + Math.round(a * 100), 0)
  return cents / 100
}

/**
 * Analyse une saisie utilisateur ("12,50", "12.50", " 12 ") en euros.
 * Retourne null si la saisie n'est pas un montant valide.
 */
export function parseAmount(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const value = Number.parseFloat(normalized)
  if (!Number.isFinite(value)) return null
  return roundCents(value)
}

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

/** Formate un montant en euros (format français : « 6,50 € »). */
export function formatEuros(amount: number): string {
  return euroFormatter.format(roundCents(amount))
}

/** Formate un montant signé selon le type de transaction. */
export function formatSignedEuros(amount: number, type: 'CREDIT' | 'DEBIT'): string {
  const sign = type === 'CREDIT' ? '+' : '-'
  return `${sign}${formatEuros(Math.abs(amount))}`
}
