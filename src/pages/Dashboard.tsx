import { useEffect, useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { AppShell } from '@/components/layout'
import { BalanceCard, BalanceCardSkeleton } from '@/components/BalanceCard'
import { Button } from '@/components/ui'
import { profileRepository, type Profile } from '@/db'
import { useAuth } from '@/contexts/AuthContext'
import { useMemberDataLoader } from '@/hooks/useMemberDataLoader'

interface ProfileWithBalance extends Profile {
  balance: number
}

export function Dashboard() {
  const navigate = useNavigate()
  const { isParentMode } = useAuth()
  const [profiles, setProfiles] = useState<ProfileWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les données depuis Drive pour les membres (enfants)
  useMemberDataLoader()

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        // Sprint 6: Afficher uniquement les profils actifs
        const activeProfiles = await profileRepository.getActive()
        const profilesWithBalances = await Promise.all(
          activeProfiles.map(async (profile) => {
            const balance = await profileRepository.getBalance(profile.id!)
            return { ...profile, balance }
          })
        )
        setProfiles(profilesWithBalances)
      } catch (error) {
        console.error('Erreur lors du chargement des profils:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [])

  const totalBalance = profiles.reduce((sum, p) => sum + p.balance, 0)
  const formattedTotal = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalBalance)

  return (
    <AppShell title="Argent de Poche" showVersion>
      <div className="space-y-5 sm:space-y-6">
        <section>
          <div className="text-center mb-5 sm:mb-6">
            <p className="text-sm text-gray-500 mb-1">Solde total</p>
            <p className="text-3xl font-bold text-gray-900">{formattedTotal}</p>
            <Link to="/stats" className="inline-block mt-2">
              <Button variant="ghost" size="sm">
                Voir les statistiques
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Comptes</h2>
          <div className="grid gap-3 sm:gap-4">
            {loading ? (
              <>
                <BalanceCardSkeleton name="Chargement..." />
                <BalanceCardSkeleton />
              </>
            ) : profiles.length > 0 ? (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() =>
                    navigate({
                      to: `/profiles/${profile.id}/transactions`,
                    })
                  }
                >
                  <BalanceCard profile={profile} balance={profile.balance} />
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Aucun profil enfant configuré.</p>
                <p className="text-sm mt-2">
                  Passez en mode parent pour ajouter un profil.
                </p>
              </div>
            )}
          </div>
        </section>

        {isParentMode && (
          <div className="fixed bottom-6 right-6">
            <Button
              variant="primary"
              onClick={() => navigate({ to: '/transactions/add' })}
              className="rounded-full w-14 h-14 shadow-lg"
            >
              <span className="text-2xl">+</span>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
