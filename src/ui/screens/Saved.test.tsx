import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SavedMeal } from '../../logic/types'
import { Saved } from './Saved'
import { SavedDetail } from './SavedDetail'

const noReminder = { show: false, lastBackupAt: null }

function meal(overrides: Partial<SavedMeal>): SavedMeal {
  return { id: 'm1', name: 'Rice Meal', isFavorite: false, createdAt: new Date(2026, 10, 8).getTime(), groups: [], ...overrides }
}

const favorite = meal({ id: 'fav', name: 'Friday Meal', isFavorite: true })
const other = meal({ id: 'oth', name: 'Tuesday Meal' })

describe('Saved', () => {
  it('lists favorites and everything else under their headings', () => {
    render(<Saved meals={[favorite, other]} onToggleFavorite={() => {}} onOpen={() => {}} reminder={noReminder} />)
    const favSection = screen.getByRole('heading', { name: 'Favorites' }).parentElement!
    const otherSection = screen.getByRole('heading', { name: 'Everything else' }).parentElement!
    expect(within(favSection).getByText('Friday Meal')).toBeInTheDocument()
    expect(within(otherSection).getByText('Tuesday Meal')).toBeInTheDocument()
    expect(within(otherSection).queryByText('Friday Meal')).not.toBeInTheDocument()
  })

  it('shows the kestrel logo in the header from a local asset', () => {
    const { container } = render(<Saved meals={[]} onToggleFavorite={() => {}} onOpen={() => {}} reminder={noReminder} />)
    const logo = container.querySelector('.top img.logo')
    expect(logo).toHaveAttribute('src', expect.stringMatching(/^\/.*pwa-64x64\.png$/))
    expect(logo).toHaveAttribute('alt', '')
  })

  it('shows the saved date on each row', () => {
    render(<Saved meals={[other]} onToggleFavorite={() => {}} onOpen={() => {}} reminder={noReminder} />)
    const expected = new Date(2026, 10, 8).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    expect(screen.getByText(`Saved ${expected}`)).toBeInTheDocument()
  })

  it('shows a message when nothing is saved', () => {
    render(<Saved meals={[]} onToggleFavorite={() => {}} onOpen={() => {}} reminder={noReminder} />)
    expect(screen.getByText('No saved meals yet')).toBeInTheDocument()
  })

  it('favorites a non-favorite and unfavorites a favorite', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<Saved meals={[favorite, other]} onToggleFavorite={onToggleFavorite} onOpen={() => {}} reminder={noReminder} />)
    await user.click(screen.getByRole('button', { name: 'Favorite Tuesday Meal' }))
    expect(onToggleFavorite).toHaveBeenLastCalledWith('oth', true)
    await user.click(screen.getByRole('button', { name: 'Unfavorite Friday Meal' }))
    expect(onToggleFavorite).toHaveBeenLastCalledWith('fav', false)
  })

  it('opens a meal when its row is tapped', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<Saved meals={[other]} onToggleFavorite={() => {}} onOpen={onOpen} reminder={noReminder} />)
    await user.click(screen.getByRole('button', { name: /^Tuesday Meal/ }))
    expect(onOpen).toHaveBeenCalledWith('oth')
  })

  it('shows the backup reminder above the list', () => {
    render(<Saved meals={[other]} onToggleFavorite={() => {}} onOpen={() => {}} reminder={{ show: true, lastBackupAt: null }} />)
    expect(screen.getByText('No backup yet')).toBeInTheDocument()
  })
})

describe('SavedDetail', () => {
  const detailMeal = meal({
    id: 'd1',
    name: 'Rice Meal with Tofu',
    groups: [
      { stepName: 'Starch/Base', items: [{ optionName: 'Rice', tips: ['Rinse it first.'] }] },
      { stepName: 'Protein', items: [{ optionName: 'Tofu', tips: [] }] },
    ],
  })

  it('shows the groups with tips inline', () => {
    render(<SavedDetail meal={detailMeal} onDelete={() => {}} onBack={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Rice Meal with Tofu' })).toBeInTheDocument()
    expect(screen.getByText('Starch/Base')).toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
    expect(screen.getByText('Rinse it first.')).toBeInTheDocument()
    expect(screen.getByText('Tofu')).toBeInTheDocument()
  })

  it('goes back', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<SavedDetail meal={detailMeal} onDelete={() => {}} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('asks before deleting and does nothing on cancel', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<SavedDetail meal={detailMeal} onDelete={onDelete} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('deletes after confirmation', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<SavedDetail meal={detailMeal} onDelete={onDelete} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(onDelete).toHaveBeenCalledWith('d1')
  })
})
