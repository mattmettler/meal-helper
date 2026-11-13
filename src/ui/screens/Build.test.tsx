import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TOO_THIN_MESSAGE } from '../../logic/copy'
import type { Catalog, Meal } from '../../logic/types'
import { Build } from './Build'

const catalog: Catalog = {
  options: [
    { id: 'rice', stepId: 'starch', name: 'Rice', note: 'fluffy', isCustom: false, hidden: false },
    { id: 'pasta', stepId: 'starch', name: 'Pasta', isCustom: false, hidden: false },
    { id: 'kale', stepId: 'greens', name: 'Kale', isCustom: false, hidden: false },
    { id: 'spinach', stepId: 'greens', name: 'Spinach', isCustom: false, hidden: false },
    { id: 'tofu', stepId: 'protein', name: 'Tofu', isCustom: false, hidden: false },
    { id: 'carrot', stepId: 'veggies', name: 'Carrot', isCustom: false, hidden: false },
    { id: 'tahini', stepId: 'sauces', name: 'Tahini', isCustom: false, hidden: false },
  ],
  pairs: [{ a: 'pasta', b: 'spinach' }, { a: 'rice', b: 'tahini' }],
  tips: [
    { id: 't1', optionId: 'rice', text: 'Rinse it first.', isCustom: false },
    { id: 't2', optionId: 'kale', text: 'Massage it.', isCustom: false },
  ],
}

function renderBuild(onSave: (meal: Meal) => void | Promise<void> = () => {}) {
  const user = userEvent.setup()
  render(<Build catalog={catalog} onSave={onSave} />)
  return user
}

const pick = (user: ReturnType<typeof userEvent.setup>, name: RegExp | string) =>
  user.click(screen.getByRole('button', { name }))

describe('Build', () => {
  it('shows the step count and name, with notes only when present', () => {
    renderBuild()
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Starch/Base' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Rice/ })).toBeInTheDocument()
    expect(screen.getByText('fluffy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pasta' })).toBeInTheDocument()
  })

  it('replaces the pick on a single-select step', async () => {
    const user = renderBuild()
    await pick(user, /^Rice/)
    await pick(user, 'Pasta')
    expect(screen.getByRole('button', { name: /^Rice/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Pasta' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps several picks on a multi-select step', async () => {
    const user = renderBuild()
    await pick(user, 'Skip')
    await pick(user, 'Kale')
    await pick(user, 'Spinach')
    expect(screen.getByRole('button', { name: 'Kale' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Spinach' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('labels the primary button Skip, Next, or Finish', async () => {
    const user = renderBuild()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
    await pick(user, 'Pasta')
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    for (let i = 0; i < 5; i++) await pick(user, /^(Next|Skip)$/)
    expect(screen.getByText('Step 6 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
  })

  it('hides options that clash with an earlier pick', async () => {
    const user = renderBuild()
    await pick(user, 'Pasta')
    await pick(user, 'Next')
    expect(screen.queryByRole('button', { name: 'Spinach' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kale' })).toBeInTheDocument()
  })

  it('tells you to skip ahead when nothing fits and still advances', async () => {
    const user = renderBuild()
    await pick(user, /^Rice/)
    for (let i = 0; i < 4; i++) await pick(user, /^(Next|Skip)$/)
    expect(screen.getByText('Step 5 of 6')).toBeInTheDocument()
    expect(screen.getByText('Nothing fits with your picks, skip ahead')).toBeInTheDocument()
    await pick(user, 'Skip')
    expect(screen.getByText('Step 6 of 6')).toBeInTheDocument()
  })

  it('goes back keeping picks', async () => {
    const user = renderBuild()
    await pick(user, 'Pasta')
    await pick(user, 'Next')
    await pick(user, /Back/)
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pasta' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('removes a later pick that clashes with a changed earlier pick', async () => {
    const user = renderBuild()
    await pick(user, /^Rice/)
    await pick(user, 'Next')
    await pick(user, 'Spinach')
    await pick(user, 'Next')
    await pick(user, /Back/)
    await pick(user, /Back/)
    await pick(user, 'Pasta')
    await pick(user, /^Pasta/)
    await pick(user, /^Rice/)
    await pick(user, 'Next')
    expect(screen.getByRole('button', { name: 'Spinach' })).toHaveAttribute('aria-pressed', 'false')
  })

  async function finishWith(user: ReturnType<typeof userEvent.setup>, picks: Array<string | RegExp>) {
    for (let i = 0; i < 5; i++) {
      const next = picks[i]
      if (next) await pick(user, next)
      await pick(user, /^(Next|Skip)$/)
    }
    await pick(user, 'Finish')
  }

  it('shows the too-thin screen and starts over', async () => {
    const user = renderBuild()
    await finishWith(user, [/^Rice/])
    expect(screen.getByText(TOO_THIN_MESSAGE)).toBeInTheDocument()
    await pick(user, 'Start over')
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Rice/ })).toHaveAttribute('aria-pressed', 'false')
  })

  describe('when the catalog changes mid-build', () => {
    const spinachHidden: Catalog = {
      ...catalog,
      options: catalog.options.map(o => (o.id === 'spinach' ? { ...o, hidden: true } : o)),
    }
    const spinachGone: Catalog = {
      ...catalog,
      options: catalog.options.filter(o => o.id !== 'spinach'),
    }

    async function pickRiceAndSpinachThenChange(changed: Catalog) {
      const user = userEvent.setup()
      const { rerender } = render(<Build catalog={catalog} onSave={() => {}} />)
      await pick(user, /^Rice/)
      await pick(user, 'Next')
      await pick(user, 'Spinach')
      await pick(user, 'Next')
      rerender(<Build catalog={changed} onSave={() => {}} />)
      await pick(user, /Back/)
      return user
    }

    it.each([['hidden', spinachHidden], ['gone', spinachGone]])('drops a pick that is now %s', async (_label, changed) => {
      const user = await pickRiceAndSpinachThenChange(changed)
      expect(screen.queryByRole('button', { name: 'Spinach' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
      for (let i = 0; i < 4; i++) await pick(user, /^(Next|Skip)$/)
      await pick(user, 'Finish')
      expect(screen.getByText(TOO_THIN_MESSAGE)).toBeInTheDocument()
    })

    it('keeps a hidden pick out of the finished meal', async () => {
      const user = await pickRiceAndSpinachThenChange(spinachHidden)
      await pick(user, 'Kale')
      for (let i = 0; i < 4; i++) await pick(user, /^(Next|Skip)$/)
      await pick(user, 'Finish')
      expect(screen.queryByText('Spinach')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Name your meal')).toHaveValue('Rice Meal with Kale')
    })
  })

  it('shows the larger kestrel logo on the too-thin screen', async () => {
    const user = renderBuild()
    await finishWith(user, [/^Rice/])
    const logo = document.querySelector('.center img')
    expect(logo).toHaveAttribute('src', expect.stringMatching(/^\/.*pwa-192x192\.png$/))
    expect(logo).toHaveAttribute('alt', '')
  })

  it('shows the prefilled name and tips under each pick', async () => {
    const user = renderBuild()
    await finishWith(user, [/^Rice/, 'Kale'])
    expect(screen.getByLabelText('Name your meal')).toHaveValue('Rice Meal with Kale')
    const rice = screen.getByText('Rice')
    expect(rice.nextElementSibling).toHaveTextContent('Rinse it first.')
    const kale = screen.getByText('Kale')
    expect(kale.nextElementSibling).toHaveTextContent('Massage it.')
  })

  it('saves with the edited name', async () => {
    const onSave = vi.fn()
    const user = renderBuild(onSave)
    await finishWith(user, [/^Rice/, 'Kale'])
    const field = screen.getByLabelText('Name your meal')
    await user.clear(field)
    await user.type(field, 'Friday meal')
    await pick(user, 'Save this meal')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0].name).toBe('Friday meal')
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
  })

  it('saves the auto name when the name is cleared', async () => {
    const onSave = vi.fn()
    const user = renderBuild(onSave)
    await finishWith(user, [/^Rice/, 'Kale'])
    await user.clear(screen.getByLabelText('Name your meal'))
    await pick(user, 'Save this meal')
    expect(onSave.mock.calls[0][0].name).toBe('Rice Meal with Kale')
  })

  it('discards back to an empty step 1', async () => {
    const onSave = vi.fn()
    const user = renderBuild(onSave)
    await finishWith(user, [/^Rice/, 'Kale'])
    await pick(user, 'Discard')
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Rice/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('ignores a second Save tap while saving and disables the buttons until it fails', async () => {
    let reject: (error: Error) => void = () => {}
    const onSave = vi.fn().mockReturnValueOnce(new Promise<void>((_, r) => { reject = r }))
    const user = renderBuild(onSave)
    await finishWith(user, [/^Rice/, 'Kale'])
    const save = screen.getByRole('button', { name: 'Save this meal' })
    await user.click(save)
    await user.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(save).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled()
    reject(new Error('disk full'))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save this meal' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Discard' })).toBeEnabled()
  })

  it('stays on the result with the typed name when saving fails, then saves on retry', async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValueOnce(undefined)
    const user = renderBuild(onSave)
    await finishWith(user, [/^Rice/, 'Kale'])
    const field = screen.getByLabelText('Name your meal')
    await user.clear(field)
    await user.type(field, 'Friday meal')
    await pick(user, 'Save this meal')
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save that one. Try again?")
    expect(screen.getByLabelText('Name your meal')).toHaveValue('Friday meal')
    expect(screen.queryByText('Step 1 of 6')).not.toBeInTheDocument()
    await pick(user, 'Save this meal')
    expect(await screen.findByText('Step 1 of 6')).toBeInTheDocument()
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(onSave.mock.calls[1][0].name).toBe('Friday meal')
  })

  it('keeps the check mark out of the accessible name, selected or not', async () => {
    const user = renderBuild()
    expect(screen.getByRole('button', { name: /^Rice\s*fluffy$/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Pasta' })).toHaveAttribute('aria-pressed', 'false')
    await pick(user, 'Pasta')
    expect(screen.getByRole('button', { name: 'Pasta' })).toHaveAttribute('aria-pressed', 'true')
    const check = screen.getByRole('button', { name: 'Pasta' }).querySelector('.check')
    expect(check).toHaveAttribute('aria-hidden', 'true')
  })

  it('scrolls back to the top when the step changes', async () => {
    const user = renderBuild()
    const area = document.querySelector<HTMLElement>('.panel-scroll')!
    area.scrollTop = 120
    await pick(user, 'Skip')
    expect(area.scrollTop).toBe(0)
    area.scrollTop = 80
    await pick(user, 'Skip')
    expect(area.scrollTop).toBe(0)
  })

  describe('scroll area and pinned button row', () => {
    const scroller = () => document.querySelector<HTMLElement>('.panel-scroll')

    it('keeps the primary button outside the scroll area while building, with the content inside it', () => {
      renderBuild()
      const area = scroller()!
      expect(area).not.toBeNull()
      const primary = screen.getByRole('button', { name: 'Skip' })
      expect(area).not.toContainElement(primary)
      expect(primary.closest('.footer')).not.toBeNull()
      expect(area).toContainElement(screen.getByRole('heading', { name: 'Build a meal' }))
      expect(area).toContainElement(screen.getByText('Step 1 of 6'))
      expect(area).toContainElement(screen.getByRole('heading', { name: 'Starch/Base' }))
      expect(area).toContainElement(screen.getByRole('button', { name: /^Rice/ }))
      expect(area).toContainElement(document.querySelector<HTMLElement>('.progress'))
    })

    it('keeps the pinned row the same on every step', async () => {
      const user = renderBuild()
      for (let i = 0; i < 5; i++) {
        await pick(user, /^(Next|Skip)$/)
        expect(scroller()).not.toContainElement(document.querySelector<HTMLElement>('.footer'))
      }
      expect(scroller()).not.toContainElement(screen.getByRole('button', { name: 'Finish' }))
    })

    it('has no pinned row on the too-thin screen and scrolls all of it', async () => {
      const user = renderBuild()
      await finishWith(user, [/^Rice/])
      expect(document.querySelector('.footer')).toBeNull()
      expect(scroller()).toContainElement(screen.getByText(TOO_THIN_MESSAGE))
      expect(scroller()).toContainElement(screen.getByRole('button', { name: 'Start over' }))
    })

    it('has no pinned row on the result screen and scrolls all of it', async () => {
      const user = renderBuild()
      await finishWith(user, [/^Rice/, 'Kale'])
      expect(document.querySelector('.footer')).toBeNull()
      expect(scroller()).toContainElement(screen.getByRole('heading', { name: 'Your meal' }))
      expect(scroller()).toContainElement(screen.getByRole('button', { name: 'Save this meal' }))
      expect(scroller()).toContainElement(screen.getByRole('button', { name: 'Discard' }))
    })
  })
})
