import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppShell } from '@/components/layout'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui'
import { PieChart, HorizontalBarChart, getChartColor } from '@/components/charts'
import { statsService, type GlobalStats, type StatsPeriod } from '@/lib/statsService'
import { profileRepository } from '@/db'

export function Stats() {
  const [period, setPeriod] = useState<StatsPeriod['value']>('30d')
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const profiles = useLiveQuery(() => profileRepository.getActive(), [])
  const periods = statsService.getAvailablePeriods()

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const profileId = selectedProfileId ? parseInt(selectedProfileId) : undefined
        const newStats = await statsService.getStats(period, profileId)
        setStats(newStats)
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadStats()
  }, [period, selectedProfileId])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const creditsPieData = stats?.creditsByMotif.slice(0, 6).map((item, index) => ({
    label: `${item.icon} ${item.label}`,
    value: item.total,
    color: getChartColor(index),
  })) || []

  const debitsPieData = stats?.debitsByMotif.slice(0, 6).map((item, index) => ({
    label: `${item.icon} ${item.label}`,
    value: item.total,
    color: getChartColor(index + 5),
  })) || []

  const creditsBarData = stats?.creditsByMotif.slice(0, 5).map((item, index) => ({
    label: `${item.icon} ${item.label}`,
    value: item.total,
    color: getChartColor(index),
  })) || []

  const debitsBarData = stats?.debitsByMotif.slice(0, 5).map((item, index) => ({
    label: `${item.icon} ${item.label}`,
    value: item.total,
    color: getChartColor(index + 5),
  })) || []

  return (
    <AppShell title="Statistiques" backTo="/">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Filtres */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Periode</p>
                <div className="flex flex-wrap gap-2">
                  {periods.map((periodOption) => (
                    <Button
                      key={periodOption.value}
                      type="button"
                      size="sm"
                      variant={period === periodOption.value ? 'primary' : 'secondary'}
                      onClick={() =>
                        setPeriod(periodOption.value as StatsPeriod['value'])
                      }
                    >
                      {periodOption.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Profil</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedProfileId === '' ? 'primary' : 'secondary'}
                    onClick={() => setSelectedProfileId('')}
                  >
                    Tous les profils
                  </Button>
                  {profiles?.map((profile) => {
                    const profileValue = profile.id!.toString()
                    return (
                      <Button
                        key={profileValue}
                        type="button"
                        size="sm"
                        variant={
                          selectedProfileId === profileValue
                            ? 'primary'
                            : 'secondary'
                        }
                        onClick={() => setSelectedProfileId(profileValue)}
                      >
                        {profile.name}
                      </Button>
                    )
                  })}
                  {profiles && profiles.length === 0 && (
                    <Button type="button" size="sm" variant="secondary" disabled>
                      Aucun profil
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resume */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : formatCurrency(stats?.totalCredits || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Credits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {isLoading ? '...' : formatCurrency(stats?.totalDebits || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Debits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p
                className={`text-2xl font-bold ${
                  (stats?.totalBalance || 0) >= 0
                    ? 'text-indigo-600'
                    : 'text-orange-600'
                }`}
              >
                {isLoading ? '...' : formatCurrency(stats?.totalBalance || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Solde</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-gray-700">
                {isLoading ? '...' : stats?.transactionCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques des credits */}
        {!isLoading && stats && stats.creditsByMotif.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">
                Repartition des credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <PieChart data={creditsPieData} size={180} />
                </div>
                <div>
                  <HorizontalBarChart
                    data={creditsBarData}
                    formatValue={(v) => formatCurrency(v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Graphiques des debits */}
        {!isLoading && stats && stats.debitsByMotif.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">
                Repartition des depenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <PieChart data={debitsPieData} size={180} />
                </div>
                <div>
                  <HorizontalBarChart
                    data={debitsBarData}
                    formatValue={(v) => formatCurrency(v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats par profil (si pas de filtre profil) */}
        {!isLoading &&
          stats &&
          !selectedProfileId &&
          stats.profileStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Soldes par profil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.profileStats.map((ps) => (
                    <div
                      key={ps.profileId}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {ps.profile && (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                            style={{ backgroundColor: ps.profile.color }}
                          >
                            {ps.profile.icon}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {ps.profile?.name || 'Inconnu'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ps.transactionCount} transaction
                            {ps.transactionCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            ps.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(ps.balance)}
                        </p>
                        <p className="text-xs text-gray-400">
                          +{formatCurrency(ps.credits)} / -{formatCurrency(ps.debits)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Message si pas de donnees */}
        {!isLoading && stats && stats.transactionCount === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">
                Aucune transaction pour cette periode.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
