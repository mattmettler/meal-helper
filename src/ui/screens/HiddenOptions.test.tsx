import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Catalog } from '../../logic/types'
import { HiddenOptions } from './HiddenOptions'

const catalog: Catalog = {
  options: [
    { id: 'shallots', stepId: 'garnish', name: 'Crispy shallots', isCustom: false, hidden: true },
    { id: 'kale', stepId: 'greens', name: 'Kale', isCustom: false, hidden: false },
    { id: 'cabbage', stepId: 'greens', name: 'Cabbage', isCustom: false, hidden: true },
  ],
  pairs: [],
  tips: [],
}

describe('HiddenOptions', () => {
  it('lists hidden options with their step name', () => {
    render(<HiddenOptions catalog={catalog} onRestore={() => {}} onBack={() => {}} />)
    expect(screen.getByText('Crispy shallots')).toBeInTheDocument()
    expect(screen.getByText('Garnish/Texture')).toBeInTheDocument()
    expect(screen.getByText('Cabbage')).toBeInTheDocument()
    expect(screen.queryByText('Kale')).not.toBeInTheDocument()
  })

  it('restores an option by id', async () => {
    const onRestore = vi.fn()
    render(<HiddenOptions catalog={catalog} onRestore={onRestore} onBack={() => {}} />)
    const buttons = screen.getAllByRole('button', { name: 'Restore' })
    await userEvent.click(buttons[1])
    expect(onRestore).toHaveBeenCalledWith('cabbage')
  })

  it('shows a friendly message when nothing is hidden', () => {
    render(<HiddenOptions catalog={{ ...catalog, options: [catalog.options[1]] }} onRestore={() => {}} onBack={() => {}} />)
    expect(screen.getByText('Nothing is hidden right now.')).toBeInTheDocument()
  })

  it('shows an alert when restoring fails', async () => {
    const onRestore = vi.fn().mockRejectedValue(new Error('nope'))
    render(<HiddenOptions catalog={catalog} onRestore={onRestore} onBack={() => {}} />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Restore' })[0])
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't restore that. Try again?")
  })

  it('disables Restore while one is pending', async () => {
    let finish: () => void = () => {}
    const onRestore = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    render(<HiddenOptions catalog={catalog} onRestore={onRestore} onBack={() => {}} />)
    const [first, second] = screen.getAllByRole('button', { name: 'Restore' })
    await userEvent.click(first)
    expect(first).toBeDisabled()
    expect(second).toBeDisabled()
    await act(async () => { finish() })
    expect(first).toBeEnabled()
  })
})
