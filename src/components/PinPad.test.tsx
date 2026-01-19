import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PinPad } from './PinPad'

describe('PinPad', () => {
  it('should render with title', () => {
    render(<PinPad onSubmit={() => {}} title="Enter PIN" />)

    expect(screen.getByText('Enter PIN')).toBeInTheDocument()
  })

  it('should render numeric keypad', () => {
    render(<PinPad onSubmit={() => {}} />)

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: `Chiffre ${i}` })).toBeInTheDocument()
    }
  })

  it('should call onSubmit with entered PIN', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<PinPad onSubmit={handleSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Chiffre 1' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 2' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 3' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 4' }))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(handleSubmit).toHaveBeenCalledWith('1234')
  })

  it('should not allow more than 4 digits', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<PinPad onSubmit={handleSubmit} />)

    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole('button', { name: 'Chiffre 1' }))
    }

    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(handleSubmit).toHaveBeenCalledWith('1111')
  })

  it('should show error message', () => {
    render(<PinPad onSubmit={() => {}} error="Invalid PIN" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid PIN')
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const handleCancel = vi.fn()
    const user = userEvent.setup()

    render(<PinPad onSubmit={() => {}} onCancel={handleCancel} />)

    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(handleCancel).toHaveBeenCalled()
  })

  it('should delete last digit when backspace is clicked', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<PinPad onSubmit={handleSubmit} showPin />)

    await user.click(screen.getByRole('button', { name: 'Chiffre 1' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 2' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 3' }))
    await user.click(screen.getByRole('button', { name: 'Effacer le dernier chiffre' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 4' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 5' }))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(handleSubmit).toHaveBeenCalledWith('1245')
  })

  it('should clear all digits when C is clicked', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<PinPad onSubmit={handleSubmit} showPin />)

    await user.click(screen.getByRole('button', { name: 'Chiffre 1' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 2' }))
    await user.click(screen.getByRole('button', { name: 'Effacer tout' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 3' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 4' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 5' }))
    await user.click(screen.getByRole('button', { name: 'Chiffre 6' }))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(handleSubmit).toHaveBeenCalledWith('3456')
  })
})
