import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { exportBackup, serializeBackup } from '../storage/backup'
import { db } from '../storage/instance'
import { saveMeal } from '../storage/savedMeals'
import { getLastBackupAt } from '../storage/settings'
import { addCustomOption, addUserTip, deleteCustomOption, setClashes } from '../storage/userData'
import { App } from './App'
import { downloadFile } from './downloadFile'

vi.mock('./downloadFile', () => ({ downloadFile: vi.fn() }))

const aMeal = (name: string) => ({
  name,
  groups: [{ stepName: 'Starch/Base', items: [{ optionName: 'Brown rice', tips: [] }] }],
})

async function openTab(user: ReturnType<typeof userEvent.setup>, label: string) {
  const nav = await screen.findByRole('navigation', { name: 'Main' })
  await user.click(within(nav).getByRole('button', { name: label }))
}

async function enabledSaveBackupFile() {
  const button = await screen.findByRole('button', { name: 'Save backup file' })
  await waitFor(() => expect(button).toBeEnabled())
  return button
}

// Passthrough spy that counts full backup reads. exportBackup is the only caller that
// reads savedMeals from inside a function named exportBackup, so the call stack identifies it.
function countBackupReads() {
  const original = db.savedMeals.toArray.bind(db.savedMeals)
  let reads = 0
  const spy = vi.spyOn(db.savedMeals, 'toArray').mockImplementation((...args: Parameters<typeof original>) => {
    if (new Error().stack?.includes('exportBackup')) reads += 1
    return original(...args)
  })
  return { reads: () => reads, stop: () => spy.mockRestore() }
}

describe('App', () => {
  afterEach(async () => {
    await Promise.all(db.tables.map(table => table.clear()))
  })

  it('shows the three tabs', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: /Build/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Saved/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Options/ })).toBeInTheDocument()
  })

  it('switches the visible heading when tabs are clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Build a meal' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Saved/ }))
    expect(screen.getByRole('heading', { name: 'Saved meals' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Build a meal' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Options/ }))
    expect(screen.getByRole('heading', { name: 'Your options' })).toBeVisible()
  })

  it('never says bowl', async () => {
    render(<App />)
    await screen.findByRole('heading', { name: 'Build a meal' })
    expect(document.body.textContent).not.toMatch(/bowl/i)
  })

  it('hides a built-in option from its detail screen and restores it from Hidden options', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Options/ }))
    const optionButton = document.querySelector<HTMLButtonElement>('.mini')!
    const name = optionButton.textContent!
    await user.click(optionButton)
    await user.click(await screen.findByRole('button', { name: 'Hide this option' }))
    expect(await screen.findByRole('heading', { name: 'Your options' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Hidden options \(1\)/ }))
    expect(screen.getByText(name)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    expect(await screen.findByText('Nothing is hidden right now.')).toBeVisible()
  })

  it('edits the clashes of a custom option and shows the result on the detail screen', async () => {
    const user = userEvent.setup()
    const id = await addCustomOption(db, { stepId: 'starch', name: 'Teff test' })
    await setClashes(db, id, ['starch.brown-rice', 'greens.kale'])
    try {
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /Options/ }))
      await user.click(await screen.findByRole('button', { name: /Teff test/ }))
      expect(document.querySelector('.card .hint')).toHaveTextContent(/Brown rice.*Kale|Kale.*Brown rice/)
      await user.click(screen.getByRole('button', { name: /Edit/ }))
      expect(screen.getByRole('checkbox', { name: 'Brown rice' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Kale' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Spinach' })).not.toBeChecked()
      expect(screen.queryByRole('checkbox', { name: 'Teff test' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('checkbox', { name: 'Kale' }))
      await user.click(screen.getByRole('checkbox', { name: 'Spinach' }))
      await user.click(screen.getByRole('button', { name: /Save option/ }))
      await waitFor(() => expect(document.querySelector('.card .hint')).toHaveTextContent(/Spinach/))
      expect(document.querySelector('.card .hint')).toHaveTextContent(/Brown rice/)
      expect(document.querySelector('.card .hint')).not.toHaveTextContent(/Kale/)
    } finally {
      await deleteCustomOption(db, id)
    }
  })

  it('deletes a custom option along with its clashes and tips', async () => {
    const user = userEvent.setup()
    const id = await addCustomOption(db, { stepId: 'starch', name: 'Teff test' })
    await setClashes(db, id, ['starch.brown-rice'])
    await addUserTip(db, id, 'Toast it first')
    try {
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /Options/ }))
      await user.click(await screen.findByRole('button', { name: /Teff test/ }))
      await user.click(screen.getByRole('button', { name: 'Delete this option' }))
      await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
      expect(await screen.findByRole('heading', { name: 'Your options' })).toBeVisible()
      await waitFor(() => expect(screen.queryByRole('button', { name: /Teff test/ })).not.toBeInTheDocument())
      expect(await db.customOptions.get(id)).toBeUndefined()
      expect(await db.userPairs.filter(p => p.optionIdA === id || p.optionIdB === id).count()).toBe(0)
      expect(await db.userTips.where('optionId').equals(id).count()).toBe(0)
    } finally {
      await deleteCustomOption(db, id)
    }
  })

  it('saves a backup file and records the export', async () => {
    const user = userEvent.setup()
    vi.mocked(downloadFile).mockClear()
    try {
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /Options/ }))
      await user.click(screen.getByRole('button', { name: 'Save a backup' }))
      await user.click(await enabledSaveBackupFile())
      await waitFor(() => expect(screen.getByText('Last backed up today')).toBeVisible())
      expect(downloadFile).toHaveBeenCalledTimes(1)
      expect(vi.mocked(downloadFile).mock.calls[0][0].name).toMatch(/^meal-guide-backup-\d{4}-\d{2}-\d{2}\.json$/)
      expect(await getLastBackupAt(db)).not.toBeNull()
    } finally {
      await db.settings.clear()
    }
  })

  it('does not record the export when the download fails', async () => {
    const user = userEvent.setup()
    vi.mocked(downloadFile).mockImplementationOnce(() => { throw new Error('blocked') })
    try {
      render(<App />)
      await user.click(await screen.findByRole('button', { name: /Options/ }))
      await user.click(screen.getByRole('button', { name: 'Save a backup' }))
      await user.click(await enabledSaveBackupFile())
      expect(await screen.findByRole('alert')).toBeVisible()
      expect(await getLastBackupAt(db)).toBeNull()
    } finally {
      await db.settings.clear()
    }
  })

  it('shows no counts in the Options backup tile', async () => {
    const user = userEvent.setup()
    await saveMeal(db, aMeal('Counted dinner'))
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Options/ }))
    expect(screen.getByRole('button', { name: 'Save a backup' })).toBeVisible()
    expect(screen.queryByText('Clashes you set')).not.toBeInTheDocument()
    expect(screen.queryByText('Counting your data...')).not.toBeInTheDocument()
  })

  it('shows the Build screen first without any backup counts', async () => {
    await saveMeal(db, aMeal('First dinner'))
    await saveMeal(db, aMeal('Second dinner'))
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Build a meal' })).toBeVisible()
    expect(screen.queryByText('Clashes you set')).not.toBeInTheDocument()
    expect(screen.queryByText('Counting your data...')).not.toBeInTheDocument()
  })

  it('reads the backup only when the export screen opens, never at startup or on edits', async () => {
    const user = userEvent.setup()
    const counter = countBackupReads()
    try {
      render(<App />)
      await screen.findByRole('heading', { name: 'Build a meal' })
      expect(counter.reads()).toBe(0)

      for (let step = 0; step < 2; step++) {
        await user.click(document.querySelector<HTMLButtonElement>('.chip')!)
        await user.click(screen.getByRole('button', { name: 'Next' }))
      }
      for (let step = 0; step < 3; step++) await user.click(screen.getByRole('button', { name: 'Skip' }))
      await user.click(screen.getByRole('button', { name: 'Finish' }))
      await user.click(screen.getByRole('button', { name: 'Save this meal' }))
      await screen.findByRole('heading', { name: 'Saved meals' })
      await user.click(await screen.findByRole('button', { name: /^Favorite / }))
      await screen.findByRole('button', { name: /^Unfavorite / })

      await user.click(screen.getByRole('button', { name: /Options/ }))
      const optionButton = document.querySelector<HTMLButtonElement>('.mini')!
      const optionName = optionButton.textContent!
      await user.click(optionButton)
      await user.type(screen.getByLabelText(`Add a tip for ${optionName}`), 'Warm it first')
      await user.click(screen.getByRole('button', { name: 'Add tip' }))
      await screen.findByText('Warm it first')
      await user.click(screen.getByRole('button', { name: 'Hide this option' }))
      await screen.findByRole('heading', { name: 'Your options' })
      await screen.findByRole('button', { name: /Hidden options \(1\)/ })
      expect(counter.reads()).toBe(0)

      await user.click(screen.getByRole('button', { name: 'Save a backup' }))
      await screen.findByText('Custom options')
      expect(counter.reads()).toBe(1)

      await user.click(screen.getByRole('button', { name: /‹ Options/ }))
      expect(counter.reads()).toBe(1)
      await user.click(screen.getByRole('button', { name: 'Save a backup' }))
      await screen.findByText('Custom options')
      expect(counter.reads()).toBe(2)
    } finally {
      counter.stop()
    }
  })

  it('opens the export screen with counts that match the data, and Back returns to Options', async () => {
    const user = userEvent.setup()
    await saveMeal(db, aMeal('First dinner'))
    await saveMeal(db, aMeal('Second dinner'))
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Options/ }))
    await user.click(screen.getByRole('button', { name: 'Save a backup' }))
    const counts = within((await screen.findByRole('heading', { name: 'Back up your data' })).closest<HTMLElement>('.step-sauces')!)
    expect((await counts.findByText('Saved meals')).parentElement).toHaveTextContent('Saved meals2')
    await user.click(screen.getByRole('button', { name: /‹ Options/ }))
    expect(screen.getByRole('heading', { name: 'Your options' })).toBeVisible()
  })

  it('shows both counts when a file is chosen to restore, and Back returns to Options', async () => {
    const user = userEvent.setup()
    await saveMeal(db, aMeal('Dinner'))
    const backupText = serializeBackup(await exportBackup(db))
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Options/ }))
    await user.click(screen.getByRole('button', { name: 'Restore from a backup' }))
    expect(screen.queryByText('This backup has')).not.toBeInTheDocument()
    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      new File([backupText], 'meal-guide-backup-2026-11-11.json', { type: 'application/json' }),
    )
    expect(await screen.findByText('This backup has')).toBeVisible()
    await waitFor(() => expect(document.querySelector('.warn')).toHaveTextContent('0 custom options, 0 tips, and 1 saved meal.'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: /‹ Options/ }))
    expect(screen.getByRole('heading', { name: 'Your options' })).toBeVisible()
  })

  it('restores a backup and starts the meal build over', async () => {
    const user = userEvent.setup()
    const backupText = serializeBackup(await exportBackup(db))
    render(<App />)
    await screen.findByRole('heading', { name: 'Build a meal' })
    await user.click(screen.getAllByRole('button', { pressed: false }).find(b => b.classList.contains('chip'))!)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Step 2 of 6')).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Options/ }))
    await user.click(screen.getByRole('button', { name: 'Restore from a backup' }))
    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      new File([backupText], 'meal-guide-backup-2026-11-11.json', { type: 'application/json' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Replace my data' }))
    await user.click(await screen.findByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: /Build/ }))
    expect(screen.getByText('Step 1 of 6')).toBeVisible()
    expect(document.querySelectorAll('.chip[aria-pressed="true"]')).toHaveLength(0)
  })

  it('builds a meal through the UI, saves it, and lists it on the Saved tab', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('heading', { name: 'Build a meal' })
    for (let step = 0; step < 2; step++) {
      await user.click(document.querySelector<HTMLButtonElement>('.chip')!)
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    for (let step = 0; step < 3; step++) await user.click(screen.getByRole('button', { name: 'Skip' }))
    await user.click(screen.getByRole('button', { name: 'Finish' }))
    const name = (screen.getByLabelText('Name your meal') as HTMLInputElement).value
    await user.click(screen.getByRole('button', { name: 'Save this meal' }))
    expect(await screen.findByRole('heading', { name: 'Saved meals' })).toBeVisible()
    expect(screen.getByText(name)).toBeVisible()
    const stored = await db.savedMeals.toArray()
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe(name)
  })

  it('moves a meal into Favorites when it is favorited and keeps it there', async () => {
    const user = userEvent.setup()
    await saveMeal(db, aMeal('Friday Meal'))
    render(<App />)
    await openTab(user, 'Saved')
    expect(screen.queryByRole('heading', { name: 'Favorites' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Favorite Friday Meal' }))
    const favorites = (await screen.findByRole('heading', { name: 'Favorites' })).parentElement!
    expect(within(favorites).getByText('Friday Meal')).toBeVisible()
    expect((await db.savedMeals.toArray())[0].isFavorite).toBe(true)
  })

  it('deletes a saved meal from its detail screen after confirming', async () => {
    const user = userEvent.setup()
    await saveMeal(db, aMeal('Friday Meal'))
    render(<App />)
    await openTab(user, 'Saved')
    await user.click(await screen.findByRole('button', { name: /^Friday Meal/ }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(await screen.findByText('No saved meals yet')).toBeVisible()
    expect(await db.savedMeals.count()).toBe(0)
  })

  describe('tab places', () => {
    it('returns Saved to its list after visiting another tab', async () => {
      const user = userEvent.setup()
      await saveMeal(db, aMeal('Friday Meal'))
      render(<App />)
      await openTab(user, 'Saved')
      await user.click(await screen.findByRole('button', { name: /^Friday Meal/ }))
      expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible()
      await openTab(user, 'Build')
      await openTab(user, 'Saved')
      expect(screen.getByRole('heading', { name: 'Saved meals' })).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    })

    it('stays on a saved meal when the Saved tab is tapped again', async () => {
      const user = userEvent.setup()
      await saveMeal(db, aMeal('Friday Meal'))
      render(<App />)
      await openTab(user, 'Saved')
      await user.click(await screen.findByRole('button', { name: /^Friday Meal/ }))
      await openTab(user, 'Saved')
      expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible()
    })

    it('keeps Build on its step and picks across round trips through other tabs', async () => {
      const user = userEvent.setup()
      render(<App />)
      await screen.findByRole('heading', { name: 'Build a meal' })
      await user.click(screen.getAllByRole('button', { pressed: false })[0])
      await user.click(screen.getByRole('button', { name: 'Next' }))
      const pick = screen.getAllByRole('button', { pressed: false })[0]
      await user.click(pick)
      const pickName = pick.textContent
      for (const other of ['Saved', 'Options', 'Saved']) {
        await openTab(user, other)
        await openTab(user, 'Build')
        expect(screen.getByText(/Step 2 of/)).toBeVisible()
        expect(screen.getByRole('button', { pressed: true })).toHaveTextContent(pickName!)
      }
    })
  })

  it('adds a custom option with a clash through the add flow', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Options')
    await user.click((await screen.findAllByRole('button', { name: '+ Add an option' }))[0])
    await user.type(screen.getByLabelText('Name'), 'Teff test')
    await user.type(screen.getByLabelText('Short note (optional)'), 'nutty')
    await user.click(screen.getByRole('button', { name: /^Next/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Kale' }))
    await user.click(screen.getByRole('button', { name: /Save option/ }))
    expect(await screen.findByRole('button', { name: /Teff test/ })).toBeVisible()
    const [option] = await db.customOptions.toArray()
    expect(option).toMatchObject({ name: 'Teff test', note: 'nutty', stepId: 'starch' })
    const pairs = await db.userPairs.toArray()
    expect(pairs).toHaveLength(1)
    expect([pairs[0].optionIdA, pairs[0].optionIdB]).toContain('greens.kale')
    expect([pairs[0].optionIdA, pairs[0].optionIdB]).toContain(option.id)
  })

  it('adds a tip to an option from its detail screen', async () => {
    const user = userEvent.setup()
    const id = await addCustomOption(db, { stepId: 'starch', name: 'Teff test' })
    render(<App />)
    await openTab(user, 'Options')
    await user.click(await screen.findByRole('button', { name: /Teff test/ }))
    await user.type(screen.getByLabelText('Add a tip for Teff test'), 'Toast it first')
    await user.click(screen.getByRole('button', { name: 'Add tip' }))
    expect(await screen.findByText('Toast it first')).toBeVisible()
    expect(await db.userTips.where('optionId').equals(id).toArray()).toHaveLength(1)
  })

  it('saves a note on a custom option from its detail screen', async () => {
    const user = userEvent.setup()
    const id = await addCustomOption(db, { stepId: 'starch', name: 'Teff test' })
    render(<App />)
    await openTab(user, 'Options')
    await user.click(await screen.findByRole('button', { name: /Teff test/ }))
    await user.type(screen.getByLabelText('Short note'), 'nutty')
    await user.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(async () => expect((await db.customOptions.get(id))?.note).toBe('nutty'))
  })
})
