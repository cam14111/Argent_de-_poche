import { useNavigate, Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '../ui/Button'
import { SyncIndicator } from '../sync/SyncIndicator'
import { APP_VERSION } from '@/lib/constants'

interface TopBarProps {
  title: string
  showModeSwitch?: boolean
  onParentModeClick?: () => void
  backTo?: string
  showVersion?: boolean
}

export function TopBar({ title, showModeSwitch = true, onParentModeClick, backTo, showVersion = false }: TopBarProps) {
  const { isParentMode, switchToChildMode } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const isHomePage = routerState.location.pathname === '/'
  const settingsLabel = isParentMode ? 'Parametres' : 'Synchronisation'

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {backTo && (
            <Link to={backTo} className="text-gray-500 hover:text-gray-700 p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          )}
          {!backTo && !isHomePage && (
            <Link to="/" className="text-gray-500 hover:text-gray-700 p-1" title="Retour à l'accueil">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
          )}
          <div className="flex items-baseline gap-2">
            {isHomePage ? (
              <h1 className="text-lg font-semibold text-gray-900 leading-none">{title}</h1>
            ) : (
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-lg font-semibold text-gray-900 leading-none">{title}</h1>
              </Link>
            )}
            {showVersion && (
              <span className="text-xs text-gray-400 leading-none">v{APP_VERSION}</span>
            )}
          </div>
        </div>

        {showModeSwitch && (
          <div className="flex items-center gap-3">
            {isParentMode && <SyncIndicator />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/settings' })}
            >
              {settingsLabel}
            </Button>
            {isParentMode ? (
              <>
                <span className="inline-flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full leading-none">
                  Mode Parent
                </span>
                <Button variant="ghost" size="sm" onClick={switchToChildMode}>
                  Verrouiller
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={onParentModeClick}>
                Mode Parent
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
