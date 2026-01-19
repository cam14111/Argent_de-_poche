import { db, type Transaction, type Motif, type Profile } from '@/db/database'

export interface StatsPeriod {
  label: string
  value: '7d' | '30d' | 'month' | 'all'
  startDate: Date | null
}

export interface MotifStat {
  motifId: number
  motif: Motif | undefined
  label: string
  icon: string
  total: number
  count: number
  percentage: number
  type: 'CREDIT' | 'DEBIT'
}

export interface ProfileStats {
  profileId: number
  profile: Profile | undefined
  credits: number
  debits: number
  balance: number
  transactionCount: number
}

export interface GlobalStats {
  totalCredits: number
  totalDebits: number
  totalBalance: number
  transactionCount: number
  creditsByMotif: MotifStat[]
  debitsByMotif: MotifStat[]
  profileStats: ProfileStats[]
}

export const statsService = {
  getPeriodDates(period: StatsPeriod['value']): { startDate: Date | null; endDate: Date } {
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    let startDate: Date | null = null

    switch (period) {
      case '7d':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case '30d':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date()
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'all':
        startDate = null
        break
    }

    return { startDate, endDate }
  },

  async getStats(
    period: StatsPeriod['value'],
    profileId?: number
  ): Promise<GlobalStats> {
    const { startDate, endDate } = this.getPeriodDates(period)

    // Recuperer toutes les transactions actives
    let transactions: Transaction[] = await db.transactions
      .filter((t) => !t.deletedAt)
      .toArray()

    // Filtrer par date
    if (startDate) {
      transactions = transactions.filter(
        (t) => t.createdAt >= startDate && t.createdAt <= endDate
      )
    }

    // Filtrer par profil si specifie
    if (profileId) {
      transactions = transactions.filter((t) => t.profileId === profileId)
    }

    // Recuperer tous les motifs et profils
    const [motifs, profiles] = await Promise.all([
      db.motifs.toArray(),
      db.profiles.toArray(),
    ])

    const motifsMap = new Map(motifs.map((m) => [m.id, m]))
    const profilesMap = new Map(profiles.map((p) => [p.id, p]))

    // Calculer les totaux
    let totalCredits = 0
    let totalDebits = 0

    const creditsByMotifMap = new Map<number, { total: number; count: number }>()
    const debitsByMotifMap = new Map<number, { total: number; count: number }>()
    const profileStatsMap = new Map<
      number,
      { credits: number; debits: number; count: number }
    >()

    for (const tx of transactions) {
      if (tx.type === 'CREDIT') {
        totalCredits += tx.amount

        const current = creditsByMotifMap.get(tx.motifId) || { total: 0, count: 0 }
        creditsByMotifMap.set(tx.motifId, {
          total: current.total + tx.amount,
          count: current.count + 1,
        })
      } else {
        totalDebits += tx.amount

        const current = debitsByMotifMap.get(tx.motifId) || { total: 0, count: 0 }
        debitsByMotifMap.set(tx.motifId, {
          total: current.total + tx.amount,
          count: current.count + 1,
        })
      }

      // Stats par profil
      const profileStat = profileStatsMap.get(tx.profileId) || {
        credits: 0,
        debits: 0,
        count: 0,
      }
      if (tx.type === 'CREDIT') {
        profileStat.credits += tx.amount
      } else {
        profileStat.debits += tx.amount
      }
      profileStat.count += 1
      profileStatsMap.set(tx.profileId, profileStat)
    }

    // Convertir en tableaux avec pourcentages
    const creditsByMotif: MotifStat[] = Array.from(creditsByMotifMap.entries())
      .map(([motifId, data]) => {
        const motif = motifsMap.get(motifId)
        return {
          motifId,
          motif,
          label: motif?.label || 'Inconnu',
          icon: motif?.icon || '?',
          total: data.total,
          count: data.count,
          percentage: totalCredits > 0 ? (data.total / totalCredits) * 100 : 0,
          type: 'CREDIT' as const,
        }
      })
      .sort((a, b) => b.total - a.total)

    const debitsByMotif: MotifStat[] = Array.from(debitsByMotifMap.entries())
      .map(([motifId, data]) => {
        const motif = motifsMap.get(motifId)
        return {
          motifId,
          motif,
          label: motif?.label || 'Inconnu',
          icon: motif?.icon || '?',
          total: data.total,
          count: data.count,
          percentage: totalDebits > 0 ? (data.total / totalDebits) * 100 : 0,
          type: 'DEBIT' as const,
        }
      })
      .sort((a, b) => b.total - a.total)

    // Stats par profil
    const profileStats: ProfileStats[] = Array.from(profileStatsMap.entries())
      .map(([pId, data]) => {
        const profile = profilesMap.get(pId)
        return {
          profileId: pId,
          profile,
          credits: data.credits,
          debits: data.debits,
          balance: data.credits - data.debits,
          transactionCount: data.count,
        }
      })
      .sort((a, b) => b.balance - a.balance)

    return {
      totalCredits,
      totalDebits,
      totalBalance: totalCredits - totalDebits,
      transactionCount: transactions.length,
      creditsByMotif,
      debitsByMotif,
      profileStats,
    }
  },

  getAvailablePeriods(): StatsPeriod[] {
    return [
      { label: '7 derniers jours', value: '7d', startDate: null },
      { label: '30 derniers jours', value: '30d', startDate: null },
      { label: 'Ce mois', value: 'month', startDate: null },
      { label: 'Tout', value: 'all', startDate: null },
    ]
  },
}
