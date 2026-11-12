import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '../storage/instance'
import { addCustomOption, addUserTip, deleteCustomOption, setClashes } from '../storage/userData'
import { App } from './App'

describe('App', () => {
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
})
