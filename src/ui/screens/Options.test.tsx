import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Catalog } from '../../logic/types'
import type { ReminderState } from './BackupReminder'
import { Options } from './Options'

const catalog: Catalog = {
  options: [
    { id: 'rice', stepId: 'starch', name: 'Brown rice', isCustom: false, hidden: false },
    { id: 'farro', stepId: 'starch', name: 'Farro', isCustom: true, hidden: false },
    { id: 'kale', stepId: 'greens', name: 'Kale', isCustom: false, hidden: false },
    { id: 'old', stepId: 'greens', name: 'Old Greens', isCustom: false, hidden: true },
  ],
  pairs: [],
  tips: [],
}

const noReminder: ReminderState = { show: false, lastBackupAt: null }

function renderOptions(reminder: ReminderState = noReminder, handlers: Partial<Parameters<typeof Options>[0]> = {}) {
  render(
    <Options
      catalog={catalog}
      onOpenOption={() => {}}
      onAdd={() => {}}
      onOpenHidden={() => {}}
      onOpenBackup={() => {}}
      reminder={reminder}
      {...handlers}
    />,
  )
}

describe('Options', () => {
  it('groups visible options under their step', () => {
    renderOptions()
    const starch = screen.getByText('Starch/Base').closest('.optgroup') as HTMLElement
    expect(within(starch).getByText('Brown rice')).toBeInTheDocument()
    expect(within(starch).queryByText('Kale')).not.toBeInTheDocument()
    const greens = screen.getByText('Greens').closest('.optgroup') as HTMLElement
    expect(within(greens).getByText('Kale')).toBeInTheDocument()
    expect(within(greens).queryByText('Brown rice')).not.toBeInTheDocument()
    expect(screen.queryByText('Old Greens')).not.toBeInTheDocument()
  })

  it('marks custom options as your own', () => {
    renderOptions()
    expect(screen.getByRole('button', { name: /Farro/ })).toHaveTextContent('your own')
    expect(screen.getByRole('button', { name: /Brown rice/ })).not.toHaveTextContent('your own')
    const marker = screen.getByRole('button', { name: /Farro/ }).querySelector('.badge')
    expect(marker).toHaveTextContent('your own')

  })

  it('opens an option and adds one for a step', async () => {
    const onOpenOption = vi.fn()
    const onAdd = vi.fn()
    renderOptions(noReminder, { onOpenOption, onAdd })
    await userEvent.click(screen.getByRole('button', { name: /Kale/ }))
    expect(onOpenOption).toHaveBeenCalledWith('kale')
    await userEvent.click(screen.getAllByRole('button', { name: '+ Add an option' })[1])
    expect(onAdd).toHaveBeenCalledWith('greens')
  })

  it('counts hidden built-in options', async () => {
    const onOpenHidden = vi.fn()
    renderOptions(noReminder, { onOpenHidden })
    await userEvent.click(screen.getByRole('button', { name: 'Hidden options (1)' }))
    expect(onOpenHidden).toHaveBeenCalled()
  })

  it('shows how long ago the last backup was', () => {
    renderOptions({ show: false, lastBackupAt: Date.now() - 12 * 24 * 60 * 60 * 1000 })
    expect(screen.getByText('Last backed up 12 days ago')).toBeInTheDocument()
  })

  it('says when there has never been a backup', () => {
    renderOptions()
    expect(screen.getByText('Never backed up')).toBeInTheDocument()
  })

  it('shows the backup reminder banner', () => {
    renderOptions({ show: true, lastBackupAt: null })
    expect(screen.getByText('No backup yet')).toBeInTheDocument()
  })

  it('opens the backup screen', async () => {
    const onOpenBackup = vi.fn()
    renderOptions(noReminder, { onOpenBackup })
    await userEvent.click(screen.getByRole('button', { name: /Backup/ }))
    expect(onOpenBackup).toHaveBeenCalled()
  })

  it('ends with the two credit lines', () => {
    renderOptions()
    const lines = screen.getByText('Icon image from vecteezy.com').parentElement!.querySelectorAll('p')
    expect(Array.from(lines).map(p => p.textContent)).toEqual(['Icon image from vecteezy.com', 'Made by Matt for kestrel <3'])
  })
})
