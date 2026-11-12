import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackupExport } from './BackupExport'

const summary = { customOptions: 4, tips: 6, clashes: 12, hiddenOptions: 3, savedMeals: 9 }
const DAY_MS = 24 * 60 * 60 * 1000

function renderExport(overrides: Partial<React.ComponentProps<typeof BackupExport>> = {}) {
  const props = {
    loadSummary: () => Promise.resolve(summary),
    lastBackupAt: null,
    fileName: 'meal-guide-backup-2026-11-11.json',
    onSave: vi.fn().mockResolvedValue(undefined),
    onBack: vi.fn(),
    ...overrides,
  }
  render(<BackupExport {...props} />)
  return props
}

describe('BackupExport', () => {
  it('shows the five counts and the file name', async () => {
    renderExport()
    await screen.findByText('Custom options')
    const rows = [
      ['Custom options', '4'], ['Your tips', '6'], ['Clashes you set', '12'], ['Hidden options', '3'], ['Saved meals', '9'],
    ]
    for (const [label, count] of rows) {
      expect(screen.getByText(label).parentElement).toHaveTextContent(`${label}${count}`)
    }
    expect(screen.getByText('meal-guide-backup-2026-11-11.json')).toBeInTheDocument()
  })

  it('says when there has never been a backup', async () => {
    renderExport()
    await screen.findByText('Custom options')
    expect(screen.getByText('Never backed up')).toBeInTheDocument()
  })

  it('says how many days ago the last backup was', async () => {
    renderExport({ lastBackupAt: Date.now() - 12 * DAY_MS })
    await screen.findByText('Custom options')
    expect(screen.getByText('Last backed up 12 days ago')).toBeInTheDocument()
  })

  it('goes back', async () => {
    const { onBack } = renderExport()
    await userEvent.click(screen.getByRole('button', { name: /Options/ }))
    expect(onBack).toHaveBeenCalled()
  })

  it('saves the backup file', async () => {
    const { onSave } = renderExport()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save backup file' })).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: 'Save backup file' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('disables Save while saving is pending', async () => {
    let finish: () => void = () => {}
    const onSave = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    renderExport({ onSave })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save backup file' })).toBeEnabled())
    const button = screen.getByRole('button', { name: 'Save backup file' })
    await userEvent.click(button)
    expect(button).toBeDisabled()
    await act(async () => { finish() })
    expect(button).toBeEnabled()
  })

  it('shows an alert when saving fails and stays on the screen', async () => {
    renderExport({ onSave: vi.fn().mockRejectedValue(new Error('nope')) })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save backup file' })).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: 'Save backup file' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save the backup. Try again?")
    expect(screen.getByRole('button', { name: 'Save backup file' })).toBeEnabled()
  })

  it('counts the data once when opened, disabling Save until the counts show', async () => {
    let finish: (value: typeof summary) => void = () => {}
    const loadSummary = vi.fn(() => new Promise<typeof summary>(resolve => { finish = resolve }))
    renderExport({ loadSummary })
    expect(screen.getByText('Counting your data...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save backup file' })).toBeDisabled()
    expect(screen.queryByText('Custom options')).not.toBeInTheDocument()
    await act(async () => { finish(summary) })
    expect(screen.queryByText('Counting your data...')).not.toBeInTheDocument()
    expect(screen.getByText('Custom options').parentElement).toHaveTextContent('Custom options4')
    expect(screen.getByRole('button', { name: 'Save backup file' })).toBeEnabled()
    expect(loadSummary).toHaveBeenCalledTimes(1)
  })

  it('shows an alert when counting fails, keeps Save disabled, and can retry', async () => {
    const loadSummary = vi.fn()
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce(summary)
    renderExport({ loadSummary })
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't read your data. Try again?")
    expect(screen.getByRole('button', { name: 'Save backup file' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Custom options')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save backup file' })).toBeEnabled()
  })
})
