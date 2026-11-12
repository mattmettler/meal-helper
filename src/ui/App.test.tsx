import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
})
