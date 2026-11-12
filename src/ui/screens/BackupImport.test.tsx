import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BACKUP_APP, BACKUP_FORMAT_VERSION, serializeBackup, type BackupFile } from '../../storage/backup'
import { BackupImport } from './BackupImport'

const currentSummary = { customOptions: 4, tips: 6, clashes: 12, hiddenOptions: 3, savedMeals: 9 }

const backup: BackupFile = {
  app: BACKUP_APP,
  formatVersion: BACKUP_FORMAT_VERSION,
  exportedAt: 1,
  data: {
    customOptions: [{ id: 'c1', stepId: 'starch', name: 'Farro' }],
    hiddenBuiltIns: [],
    userPairs: [],
    userTips: [{ id: 1, optionId: 'c1', text: 'Rinse first' }, { id: 2, optionId: 'c1', text: 'Toast it' }],
    savedMeals: [{ id: 'm1', name: 'Dinner', groups: [], isFavorite: false, createdAt: 1 }],
  },
}

function jsonFile(text: string) {
  return new File([text], 'meal-guide-backup-2026-10-30.json', { type: 'application/json' })
}

async function chooseFile(text: string) {
  await userEvent.upload(screen.getByLabelText('Choose a backup file'), jsonFile(text))
}

function renderImport(onReplace = vi.fn().mockResolvedValue(undefined)) {
  const onBack = vi.fn()
  render(<BackupImport currentSummary={currentSummary} onReplace={onReplace} onBack={onBack} />)
  return { onReplace, onBack }
}

describe('BackupImport', () => {
  it('shows the counts in a valid backup and what will be replaced', async () => {
    renderImport()
    await chooseFile(serializeBackup(backup))
    expect(await screen.findByText('meal-guide-backup-2026-10-30.json')).toBeInTheDocument()
    expect(screen.getByText('Custom options').parentElement).toHaveTextContent('Custom options1')
    expect(screen.getByText('Your tips').parentElement).toHaveTextContent('Your tips2')
    expect(screen.getByText('Saved meals').parentElement).toHaveTextContent('Saved meals1')
    expect(document.querySelector('.warn')).toHaveTextContent(
      "This replaces what's on this phone now: 4 custom options, 6 tips, and 9 saved meals. It can't be undone.",
    )
  })

  it('replaces the data with the parsed file and then says all restored', async () => {
    const { onReplace } = renderImport()
    await chooseFile(serializeBackup(backup))
    await userEvent.click(await screen.findByRole('button', { name: 'Replace my data' }))
    expect(onReplace).toHaveBeenCalledWith(backup)
    expect(await screen.findByText('All restored!')).toBeInTheDocument()
    expect(screen.getByText('1 custom options, 2 tips, and 1 saved meals are back.')).toBeInTheDocument()
  })

  it('goes back when Done is pressed after restoring', async () => {
    const { onBack } = renderImport()
    await chooseFile(serializeBackup(backup))
    await userEvent.click(await screen.findByRole('button', { name: 'Replace my data' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Done' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('cancels without changing anything and returns to choosing a file', async () => {
    const { onReplace } = renderImport()
    await chooseFile(serializeBackup(backup))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(onReplace).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Choose a backup file')).toBeInTheDocument()
  })

  it.each([
    ['non-JSON', 'this is not json'],
    ['truncated JSON', serializeBackup(backup).slice(0, 40)],
  ])('rejects %s without changing anything', async (_name, text) => {
    const { onReplace } = renderImport()
    await chooseFile(text)
    expect(await screen.findByText("Hmm, that doesn't look like one of my backups.")).toBeInTheDocument()
    expect(onReplace).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Replace my data' })).not.toBeInTheDocument()
  })

  it('rejects a backup from a newer version of the app', async () => {
    const { onReplace } = renderImport()
    await chooseFile(serializeBackup({ ...backup, formatVersion: BACKUP_FORMAT_VERSION + 1 }))
    expect(await screen.findByText('This backup is from a newer version of the app')).toBeInTheDocument()
    expect(onReplace).not.toHaveBeenCalled()
  })

  it('lets you choose another file after a bad one', async () => {
    renderImport()
    await chooseFile('nope')
    await userEvent.click(await screen.findByRole('button', { name: 'Choose another file' }))
    expect(screen.getByLabelText('Choose a backup file')).toBeInTheDocument()
  })

  it('disables Replace while restoring is pending', async () => {
    let finish: () => void = () => {}
    const onReplace = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    renderImport(onReplace)
    await chooseFile(serializeBackup(backup))
    const button = await screen.findByRole('button', { name: 'Replace my data' })
    await userEvent.click(button)
    expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.queryByText('All restored!')).not.toBeInTheDocument()
    await act(async () => { finish() })
    expect(await screen.findByText('All restored!')).toBeInTheDocument()
  })

  it('shows an alert when restoring fails and stays on the confirm screen', async () => {
    renderImport(vi.fn().mockRejectedValue(new Error('nope')))
    await chooseFile(serializeBackup(backup))
    await userEvent.click(await screen.findByRole('button', { name: 'Replace my data' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't restore that. Nothing was changed. Try again?")
    expect(screen.getByRole('button', { name: 'Replace my data' })).toBeEnabled()
    expect(screen.queryByText('All restored!')).not.toBeInTheDocument()
  })
})
