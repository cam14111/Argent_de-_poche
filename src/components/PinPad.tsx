import { useState, useCallback } from 'react'
import { Button } from './ui/Button'

interface PinPadProps {
  onSubmit: (pin: string) => void
  onCancel?: () => void
  title?: string
  error?: string
  loading?: boolean
  showPin?: boolean
}

const PIN_LENGTH = 4

export function PinPad({
  onSubmit,
  onCancel,
  title = 'Entrez votre code PIN',
  error,
  loading = false,
  showPin: initialShowPin = false,
}: PinPadProps) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(initialShowPin)

  const handleDigit = useCallback((digit: string) => {
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev
      return prev + digit
    })
  }, [])

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setPin('')
  }, [])

  const handleSubmit = useCallback(() => {
    if (pin.length === PIN_LENGTH) {
      onSubmit(pin)
      setPin('')
    }
  }, [pin, onSubmit])

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']

  return (
    <div className="flex flex-col items-center p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>

      <div className="flex gap-3 mb-4" role="status" aria-live="polite">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`
              w-4 h-4 rounded-full border-2 transition-colors
              ${
                i < pin.length
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'bg-transparent border-gray-300'
              }
            `}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">
          {pin.length} chiffres sur {PIN_LENGTH} saisis
        </span>
      </div>

      <button
        type="button"
        onClick={() => setShowPin(!showPin)}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        aria-pressed={showPin}
      >
        {showPin ? 'Masquer' : 'Afficher'} le code
      </button>

      {showPin && pin.length > 0 && (
        <div className="text-2xl font-mono tracking-widest mb-4" aria-live="polite">
          {pin}
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm mb-4" role="alert">
          {error}
        </div>
      )}

      <div
        className="grid grid-cols-3 gap-3 mb-6"
        role="group"
        aria-label="Clavier numérique"
      >
        {digits.map((digit, i) => (
          <div key={i} className="w-16 h-16">
            {digit ? (
              <button
                type="button"
                onClick={() => handleDigit(digit)}
                disabled={loading || pin.length >= PIN_LENGTH}
                className="w-full h-full rounded-full bg-gray-100 hover:bg-gray-200
                         text-2xl font-semibold text-gray-900
                         transition-colors disabled:opacity-50"
                aria-label={`Chiffre ${digit}`}
              >
                {digit}
              </button>
            ) : i === 9 ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={loading || pin.length === 0}
                className="w-full h-full rounded-full bg-gray-50 hover:bg-gray-100
                         text-sm font-medium text-gray-600
                         transition-colors disabled:opacity-50"
                aria-label="Effacer tout"
              >
                C
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || pin.length === 0}
                className="w-full h-full rounded-full bg-gray-50 hover:bg-gray-100
                         text-xl text-gray-600
                         transition-colors disabled:opacity-50"
                aria-label="Effacer le dernier chiffre"
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={pin.length !== PIN_LENGTH || loading}
          loading={loading}
        >
          Valider
        </Button>
      </div>
    </div>
  )
}
