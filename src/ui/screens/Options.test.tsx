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
      onExport={() => {}}
      onImport={() => {}}
      reminder={reminder}
      {...handlers}
    />,
  )
}

describe('Options', () => {
  it('shows the kestrel logo in the header from a local asset', () => {
    const { container } = render(
      <Options catalog={catalog} onOpenOption={() => {}} onAdd={() => {}} onOpenHidden={() => {}} onExport={() => {}} onImport={() => {}} reminder={noReminder} />,
    )
    const logo = container.querySelector('.top img.logo')
    expect(logo).toHaveAttribute('src', expect.stringMatching(/^\/.*pwa-64x64\.png$/))
    expect(logo).toHaveAttribute('alt', '')
  })

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

  it('marks custom options with a dashed pill and screen-reader-only text, not a visible badge', () => {
    renderOptions()
    const farro = screen.getByRole('button', { name: 'Farro custom' })
    expect(farro).toHaveClass('custom')
    expect(farro.querySelector('.badge')).toBeNull()
    expect(farro.querySelector('.visually-hidden')).toHaveTextContent('custom')
    const rice = screen.getByRole('button', { name: 'Brown rice' })
    expect(rice).not.toHaveClass('custom')
    expect(rice).not.toHaveTextContent('custom')
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

  it('has Save a backup and Restore from a backup buttons and no counts in the backup tile', () => {
    renderOptions()
    expect(screen.getByRole('heading', { name: 'Backup' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save a backup' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore from a backup' })).toBeInTheDocument()
    expect(screen.queryByText(/saved meal|tips|custom options/i)).not.toBeInTheDocument()
  })

  it('starts a backup export from Save a backup', async () => {
    const onExport = vi.fn()
    const onImport = vi.fn()
    renderOptions(noReminder, { onExport, onImport })
    await userEvent.click(screen.getByRole('button', { name: 'Save a backup' }))
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onImport).not.toHaveBeenCalled()
  })

  it('starts a restore from Restore from a backup', async () => {
    const onExport = vi.fn()
    const onImport = vi.fn()
    renderOptions(noReminder, { onExport, onImport })
    await userEvent.click(screen.getByRole('button', { name: 'Restore from a backup' }))
    expect(onImport).toHaveBeenCalledTimes(1)
    expect(onExport).not.toHaveBeenCalled()
  })

  it('ends with the two credit lines', () => {
    renderOptions()
    const lines = screen.getByText('Icon image from vecteezy.com').parentElement!.querySelectorAll('p')
    expect(Array.from(lines).map(p => p.textContent)).toEqual(['Icon image from vecteezy.com', 'Made by Matt for kestrel <3'])
  })
})
