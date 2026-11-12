import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
})
