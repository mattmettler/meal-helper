import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Catalog } from '../../logic/types'
import { Compatibility } from './Compatibility'

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

function renderIt(onSave: (ids: string[]) => void | Promise<void> = () => {}) {
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
}

describe('Compatibility', () => {
  it('reflects the initial checks', () => {
    renderIt()
    expect(screen.getByRole('checkbox', { name: 'Kale' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Brown rice' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Save option (1 checked)' })).toBeInTheDocument()
  })

  it('updates the count and saves the checked ids', async () => {
    const onSave = vi.fn()
    renderIt(onSave)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Brown rice' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save option (2 checked)' }))
    expect(onSave).toHaveBeenCalledWith(['kale', 'rice'])
  })

  it('leaves out the option being edited and hidden options', () => {
    renderIt()
    expect(screen.queryByRole('checkbox', { name: 'Farro' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Old Greens' })).not.toBeInTheDocument()
  })

  it('shows an alert and keeps the checks when saving fails, then allows a retry', async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined)
    renderIt(onSave)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Brown rice' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save option (2 checked)' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save that option. Try again?")
    expect(screen.getByRole('checkbox', { name: 'Brown rice' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Kale' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Save option (2 checked)' }))
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables Save while a save is pending', async () => {
    let finish: () => void = () => {}
    const onSave = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    renderIt(onSave)
    const save = screen.getByRole('button', { name: 'Save option (1 checked)' })
    await userEvent.click(save)
    expect(save).toBeDisabled()
    await userEvent.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)
    await act(async () => { finish() })
    expect(save).toBeEnabled()
  })
})
