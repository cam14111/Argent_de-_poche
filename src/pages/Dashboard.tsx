import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout'
import { BalanceCard, BalanceCardSkeleton } from '@/components/BalanceCard'
import { AllowanceBanner } from '@/components/AllowanceBanner'
import { GoalProgress } from '@/components/GoalProgress'
import { Button } from '@/components/ui'
import { profileRepository, type Profile } from '@/db'
import { useAuth } from '@/contexts/AuthContext'
import { useMemberDataLoader } from '@/hooks/useMemberDataLoader'
import { getGoals, computeProgress, type GoalWithProgress } from '@/lib/goals'
import { formatEuros } from '@/lib/money'

interface ProfileWithBalance extends Profile {
  balance: number
  goals: GoalWithProgress[]
}

export function Dashboard() {
  const navigate = useNavigate()
  const { isParentMode } = useAuth()
  const [profiles, setProfiles] = useState<ProfileWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les données depuis Drive pour les membres (enfants)
  useMemberDataLoader()

  const loadProfiles = useCallback(async () => {
    try {
      const [activeProfiles, allGoals] = await Promise.all([
        profileRepository.getActive(),
        getGoals(),
      ])
      const profilesWithBalances = await Promise.all(
        activeProfiles.map(async (profile) => {
          const balance = await profileRepository.getBalance(profile.id!)
          const goals = allGoals
            .filter((g) => g.profileId === profile.id)
            .map((g) => computeProgress(g, balance))
          return { ...profile, balance, goals }
        })
      )
      setProfiles(profilesWithBalances)
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  const totalBalance = profiles.reduce((sum, p) => sum + p.balance, 0)

  return (
    <AppShell title="Argent de Poche" showVersion>
      <div className="space-y-5 sm:space-y-6 pb-24">
        {isParentMode && <AllowanceBanner onApplied={loadProfiles} />}

        <section>
          <div className="text-center mb-5 sm:mb-6">
            <p className="text-sm text-gray-500 mb-1">Solde total</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatEuros(totalBalance)}
            </p>
            <Link to="/stats" className="inline-block mt-2">
              <Button variant="ghost" size="sm">
                Voir les statistiques
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Comptes
          </h2>
          <div className="grid gap-3 sm:gap-4">
            {loading ? (
              <>
                <BalanceCardSkeleton name="Chargement..." />
                <BalanceCardSkeleton />
              </>
            ) : profiles.length > 0 ? (
              profiles.map((profile) => (
                <div key={profile.id} className="space-y-2">
                  <BalanceCard
                    profile={profile}
                    balance={profile.balance}
                    onClick={() =>
                      navigate({ to: `/profiles/${profile.id}/transactions` })
                    }
                  />
                  {profile.goals.length > 0 && (
                    <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-3 space-y-3">
                      {profile.goals.map((goal) => (
                        <GoalProgress key={goal.id} goal={goal} compact />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Aucun profil enfant configuré.</p>
                <p className="text-sm mt-2">
                  {isParentMode
                    ? 'Ajoutez un profil depuis Paramètres → Gérer les profils.'
                    : 'Passez en mode parent pour ajouter un profil.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {isParentMode && (
          <div className="fixed bottom-6 right-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <Button
              variant="primary"
              onClick={() => navigate({ to: '/transactions/add' })}
              className="rounded-full w-14 h-14 shadow-lg text-2xl"
              aria-label="Ajouter une transaction"
            >
              +
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
