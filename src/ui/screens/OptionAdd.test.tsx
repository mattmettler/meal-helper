import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptionAdd } from './OptionAdd'

describe('OptionAdd', () => {
  it('asks for a name when it is blank', async () => {
    const onNext = vi.fn()
    render(<OptionAdd onNext={onNext} onBack={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Give it a name')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('rejects a note over 40 characters', async () => {
    const onNext = vi.fn()
    render(<OptionAdd onNext={onNext} onBack={() => {}} />)
    await userEvent.type(screen.getByLabelText('Name'), 'Farro')
    await userEvent.type(screen.getByLabelText('Short note (optional)'), 'x'.repeat(41))
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('Keep the note to 40 characters or fewer')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('counts the note characters', async () => {
    render(<OptionAdd onNext={() => {}} onBack={() => {}} />)
    await userEvent.type(screen.getByLabelText('Short note (optional)'), 'chewy and nutty')
    expect(screen.getByText('15 / 40')).toBeInTheDocument()
  })

  it('previews the typed name and note', async () => {
    render(<OptionAdd onNext={() => {}} onBack={() => {}} />)
    await userEvent.type(screen.getByLabelText('Name'), 'Farro')
    await userEvent.type(screen.getByLabelText('Short note (optional)'), 'chewy and nutty')
    const preview = screen.getByText('How it will look').parentElement!
    expect(preview).toHaveTextContent('Farro')
    expect(preview).toHaveTextContent('chewy and nutty')
  })

  it('passes the chosen step and trimmed name to onNext', async () => {
    const onNext = vi.fn()
    render(<OptionAdd onNext={onNext} onBack={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Greens' }))
    await userEvent.type(screen.getByLabelText('Name'), '  Farro  ')
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(onNext).toHaveBeenCalledWith({ stepId: 'greens', name: 'Farro', note: undefined })
  })

  it('starts on the step it was opened for', () => {
    render(<OptionAdd initialStepId="sauces" onNext={() => {}} onBack={() => {}} />)
    expect(screen.getByRole('button', { name: 'Sauces' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('trims the note and drops a whitespace-only one', async () => {
    const onNext = vi.fn()
    render(<OptionAdd onNext={onNext} onBack={() => {}} />)
    await userEvent.type(screen.getByLabelText('Name'), 'Farro')
    await userEvent.type(screen.getByLabelText('Short note (optional)'), '  nutty  ')
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(onNext).toHaveBeenLastCalledWith({ stepId: 'starch', name: 'Farro', note: 'nutty' })
    await userEvent.clear(screen.getByLabelText('Short note (optional)'))
    await userEvent.type(screen.getByLabelText('Short note (optional)'), '   ')
    await userEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(onNext).toHaveBeenLastCalledWith({ stepId: 'starch', name: 'Farro', note: undefined })
  })

  it('keeps the name and note it is given back', () => {
    render(<OptionAdd initialName="Farro" initialNote="nutty" onNext={() => {}} onBack={() => {}} />)
    expect(screen.getByLabelText('Name')).toHaveValue('Farro')
    expect(screen.getByLabelText('Short note (optional)')).toHaveValue('nutty')
  })
})
