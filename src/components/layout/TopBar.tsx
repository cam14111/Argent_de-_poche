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
      <div className="flex items-center justify-between px-3 sm:px-4 h-14">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
          {backTo && (
            <Link to={backTo} className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0">
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
            <Link to="/" className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0" title="Retour à l'accueil">
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
          <div className="flex items-center gap-1.5 min-w-0">
            {isHomePage ? (
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight truncate">{title}</h1>
            ) : (
              <Link to="/" className="hover:opacity-80 transition-opacity min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight truncate">{title}</h1>
              </Link>
            )}
            {showVersion && (
              <span className="text-xs text-gray-400 leading-tight flex-shrink-0">v{APP_VERSION}</span>
            )}
          </div>
        </div>

        {showModeSwitch && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isParentMode && <SyncIndicator />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/settings' })}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              {settingsLabel}
            </Button>
            {isParentMode ? (
              <>
                <span className="inline-flex items-center text-[10px] sm:text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full leading-tight whitespace-nowrap">
                  Mode Parent
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={switchToChildMode}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Verrouiller
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onParentModeClick}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Mode Parent
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
