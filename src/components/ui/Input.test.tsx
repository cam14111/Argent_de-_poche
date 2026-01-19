import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  it('should render with label', () => {
    render(<Input label="Email" />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('should handle input changes', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Input label="Email" onChange={handleChange} />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')

    expect(handleChange).toHaveBeenCalled()
  })

  it('should show error message', () => {
    render(<Input label="Email" error="Email is required" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
  })

  it('should show helper text', () => {
    render(<Input label="Email" helperText="Enter your email address" />)

    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('should not show helper text when there is an error', () => {
    render(
      <Input
        label="Email"
        error="Email is required"
        helperText="Enter your email address"
      />
    )

    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should have aria-invalid when there is an error', () => {
    render(<Input label="Email" error="Email is required" />)

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Email" disabled />)

    expect(screen.getByLabelText('Email')).toBeDisabled()
  })
})
