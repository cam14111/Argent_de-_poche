/**
 * Service de chargement des données pour les membres (enfants)
 * Télécharge et importe le dernier backup du dossier partagé en lecture seule
 */

import { syncService } from './SyncService'
import { JsonImporter } from '../backup'

/**
 * Service de chargement des données pour les membres
 */
export class MemberDataLoader {
  private lastLoadAt = 0
  private minInterval = 30000 // 30 secondes par défaut
  private isLoading = false
  private loadPromise: Promise<void> | null = null

  /**
   * Charge les données si l'utilisateur est en mode member
   * et si le délai minimum est respecté
   * @returns true si le chargement a été effectué, false sinon
   */
  async loadIfMember(): Promise<boolean> {
    const now = Date.now()
    const elapsed = now - this.lastLoadAt

    // Vérifier si on respecte l'intervalle minimum
    if (elapsed < this.minInterval) {
      console.log(
        `[MemberDataLoader] Skipping load - ${Math.ceil((this.minInterval - elapsed) / 1000)}s remaining`
      )
      return false
    }

    // Si un chargement est déjà en cours, attendre sa fin
    if (this.isLoading && this.loadPromise) {
      console.log('[MemberDataLoader] Load already in progress, waiting...')
      await this.loadPromise
      return true
    }

    try {
      this.isLoading = true
      this.loadPromise = this.performLoad()
      await this.loadPromise
      this.lastLoadAt = Date.now()
      return true
    } finally {
      this.isLoading = false
      this.loadPromise = null
    }
  }

  /**
   * Force le chargement sans vérifier l'intervalle
   */
  async forceLoad(): Promise<void> {
    // Si un chargement est déjà en cours, attendre sa fin
    if (this.isLoading && this.loadPromise) {
      console.log('[MemberDataLoader] Load already in progress, waiting...')
      await this.loadPromise
      return
    }

    try {
      this.isLoading = true
      this.loadPromise = this.performLoad()
      await this.loadPromise
      this.lastLoadAt = Date.now()
    } finally {
      this.isLoading = false
      this.loadPromise = null
    }
  }

  /**
   * Effectue le chargement des données
   */
  private async performLoad(): Promise<void> {
    console.log('[MemberDataLoader] Starting data load...')

    // Télécharger le dernier backup
    const payload = await syncService.downloadLatestBackup()

    if (!payload) {
      console.log('[MemberDataLoader] No backup found')
      return
    }

    // Importer les données en mode replace (lecture seule pour l'enfant)
    await JsonImporter.importPayload(payload, 'replace')

    console.log('[MemberDataLoader] Data loaded successfully')
  }

  /**
   * Définit l'intervalle minimum entre les chargements
   * @param ms Intervalle en millisecondes
   */
  setMinInterval(ms: number): void {
    this.minInterval = ms
  }

  /**
   * Retourne l'intervalle minimum actuel
   */
  getMinInterval(): number {
    return this.minInterval
  }

  /**
   * Vérifie si un chargement est en cours
   */
  getIsLoading(): boolean {
    return this.isLoading
  }

  /**
   * Retourne le temps écoulé depuis le dernier chargement
   */
  getTimeSinceLastLoad(): number {
    if (this.lastLoadAt === 0) return Infinity
    return Date.now() - this.lastLoadAt
  }

  /**
   * Réinitialise l'état du loader
   */
  reset(): void {
    this.lastLoadAt = 0
    this.isLoading = false
    this.loadPromise = null
  }
}

/**
 * Instance singleton du service
 */
export const memberDataLoader = new MemberDataLoader()
