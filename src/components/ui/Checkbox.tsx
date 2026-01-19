import { type InputHTMLAttributes, forwardRef } from 'react'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, className = '', id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              aria-describedby={helperText ? `${checkboxId}-helper` : undefined}
              className={`
                w-4 h-4 rounded border-gray-300
                text-indigo-600
                focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0
                transition-colors duration-200
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${className}
              `}
              {...props}
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor={checkboxId}
              className="font-medium text-gray-700"
            >
              {label}
            </label>
            {helperText && (
              <p id={`${checkboxId}-helper`} className="text-gray-500">
                {helperText}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
