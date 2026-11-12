import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Catalog } from '../../logic/types'
import { Compatibility } from './Compatibility'
import { OptionAdd } from './OptionAdd'

const catalog: Catalog = {
  options: [
    { id: 'rice', stepId: 'starch', name: 'Brown rice', isCustom: false, hidden: false },
    { id: 'kale', stepId: 'greens', name: 'Kale', isCustom: false, hidden: false },
    { id: 'old', stepId: 'greens', name: 'Old Greens', isCustom: false, hidden: true },
    { id: 'farro', stepId: 'starch', name: 'Farro', isCustom: true, hidden: false },
  ],
  pairs: [],
  tips: [],
}

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
})

describe('Compatibility', () => {
  function renderIt() {
    const onSave = vi.fn()
    render(
      <Compatibility
        catalog={catalog}
        optionName="Quinoa"
        stepId="starch"
        initialChecked={['kale']}
        excludeOptionId="farro"
        onSave={onSave}
        onBack={() => {}}
      />,
    )
    return onSave
  }

  it('reflects the initial checks', () => {
    renderIt()
    expect(screen.getByRole('checkbox', { name: 'Kale' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Brown rice' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Save option (1 checked)' })).toBeInTheDocument()
  })

  it('updates the count and saves the checked ids', async () => {
    const onSave = renderIt()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Brown rice' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save option (2 checked)' }))
    expect(onSave).toHaveBeenCalledWith(['kale', 'rice'])
  })

  it('leaves out the option being edited and hidden options', () => {
    renderIt()
    expect(screen.queryByRole('checkbox', { name: 'Farro' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Old Greens' })).not.toBeInTheDocument()
  })
})
