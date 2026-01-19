import { lazy, Suspense } from 'react'
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { Dashboard } from './pages/Dashboard'
import { DevSwReset } from './pages/DevSwReset'

// Sprint 6: Lazy loading des pages secondaires
const AddTransaction = lazy(() =>
  import('./pages/AddTransaction').then((m) => ({ default: m.AddTransaction }))
)
const TransactionList = lazy(() =>
  import('./pages/TransactionList').then((m) => ({ default: m.TransactionList }))
)
const TransactionDetail = lazy(() =>
  import('./pages/TransactionDetail').then((m) => ({ default: m.TransactionDetail }))
)
const Settings = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings }))
)
const GoogleAuthDebug = lazy(() =>
  import('./pages/GoogleAuthDebug').then((m) => ({ default: m.GoogleAuthDebug }))
)
const MotifsManagement = lazy(() =>
  import('./pages/MotifsManagement').then((m) => ({ default: m.MotifsManagement }))
)
const ProfilesManagement = lazy(() =>
  import('./pages/ProfilesManagement').then((m) => ({ default: m.ProfilesManagement }))
)
const Stats = lazy(() =>
  import('./pages/Stats').then((m) => ({ default: m.Stats }))
)
const Help = lazy(() =>
  import('./pages/Help').then((m) => ({ default: m.Help }))
)

// Composant de fallback pour le lazy loading
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
}

// Wrapper pour les composants lazy
function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>) {
  return function SuspenseWrapper() {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    )
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const addTransactionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions/add',
  component: withSuspense(AddTransaction),
})

const transactionListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profiles/$profileId/transactions',
  component: withSuspense(TransactionList),
})

const transactionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions/$id',
  component: withSuspense(TransactionDetail),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: withSuspense(Settings),
})

const motifsManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/motifs',
  component: withSuspense(MotifsManagement),
})

const profilesManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/profiles',
  component: withSuspense(ProfilesManagement),
})

const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stats',
  component: withSuspense(Stats),
})

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/help',
  component: withSuspense(Help),
})

const googleAuthDebugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug/google-auth',
  component: withSuspense(GoogleAuthDebug),
})

const devSwResetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/__dev/sw-reset',
  component: DevSwReset,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  addTransactionRoute,
  transactionListRoute,
  transactionDetailRoute,
  settingsRoute,
  motifsManagementRoute,
  profilesManagementRoute,
  statsRoute,
  helpRoute,
  googleAuthDebugRoute,
  devSwResetRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
