import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Catalog } from '../../logic/types'
import { OptionDetail } from './OptionDetail'

const catalog: Catalog = {
  options: [
    { id: 'farro', stepId: 'starch', name: 'Farro', note: 'chewy and nutty', isCustom: true, hidden: false },
    { id: 'rice', stepId: 'starch', name: 'Brown rice', isCustom: false, hidden: false },
    { id: 'peanut', stepId: 'sauces', name: 'Peanut sauce', isCustom: false, hidden: false },
    { id: 'chicken', stepId: 'protein', name: 'Chicken thighs', note: 'Juicy and forgiving', isCustom: false, hidden: false },
  ],
  pairs: [{ a: 'farro', b: 'rice' }, { a: 'peanut', b: 'farro' }],
  tips: [
    { id: 't1', optionId: 'farro', text: 'Rinse first.', isCustom: true },
    { id: 't2', optionId: 'chicken', text: 'Pat dry first.', isCustom: false },
    { id: 't3', optionId: 'chicken', text: 'Marinate in yogurt.', isCustom: true },
  ],
}

function renderIt(optionId: string, handlers: Partial<Parameters<typeof OptionDetail>[0]> = {}) {
  render(
    <OptionDetail
      catalog={catalog}
      optionId={optionId}
      onSaveNote={() => {}}
      onEditClashes={() => {}}
      onAddTip={() => {}}
      onDeleteTip={() => {}}
      onHide={() => {}}
      onDelete={() => {}}
      onBack={() => {}}
      {...handlers}
    />,
  )
}

describe('OptionDetail for a custom option', () => {
  it('shows an editable note with the counter and saves it', async () => {
    const onSaveNote = vi.fn()
    renderIt('farro', { onSaveNote })
    const note = screen.getByLabelText('Short note')
    expect(note).toHaveValue('chewy and nutty')
    expect(screen.getByText('15 / 40')).toBeInTheDocument()
    await userEvent.clear(note)
    await userEvent.type(note, '  softer  ')
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(onSaveNote).toHaveBeenCalledWith('softer')
  })

  it('saves a cleared note as undefined', async () => {
    const onSaveNote = vi.fn()
    renderIt('farro', { onSaveNote })
    await userEvent.clear(screen.getByLabelText('Short note'))
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(onSaveNote).toHaveBeenCalledWith(undefined)
  })

  it('rejects an over-length note without calling onSaveNote', async () => {
    const onSaveNote = vi.fn()
    renderIt('farro', { onSaveNote })
    const note = screen.getByLabelText('Short note')
    await userEvent.clear(note)
    await userEvent.type(note, 'x'.repeat(41))
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Keep the note to 40 characters or fewer')
    expect(onSaveNote).not.toHaveBeenCalled()
  })

  it('shows an alert and keeps the note when saving the note fails, then allows a retry', async () => {
    const onSaveNote = vi.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined)
    renderIt('farro', { onSaveNote })
    const note = screen.getByLabelText('Short note')
    await userEvent.clear(note)
    await userEvent.type(note, 'softer')
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save that. Try again?")
    expect(note).toHaveValue('softer')
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(onSaveNote).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables Save note while a save is pending', async () => {
    let finish: () => void = () => {}
    const onSaveNote = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    renderIt('farro', { onSaveNote })
    const save = screen.getByRole('button', { name: 'Save note' })
    await userEvent.click(save)
    expect(save).toBeDisabled()
    await userEvent.click(save)
    expect(onSaveNote).toHaveBeenCalledTimes(1)
    await act(async () => { finish() })
    expect(save).toBeEnabled()
  })

  it('lists current clashes and opens the editor', async () => {
    const onEditClashes = vi.fn()
    renderIt('farro', { onEditClashes })
    expect(screen.getByText('Brown rice, Peanut sauce')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Edit/ }))
    expect(onEditClashes).toHaveBeenCalled()
  })

  it('deletes only the user tips', async () => {
    const onDeleteTip = vi.fn()
    renderIt('farro', { onDeleteTip })
    await userEvent.click(screen.getByRole('button', { name: 'Delete tip: Rinse first.' }))
    expect(onDeleteTip).toHaveBeenCalledWith('t1')
  })

  it('asks for confirmation before deleting; cancel does nothing', async () => {
    const onDelete = vi.fn()
    renderIt('farro', { onDelete })
    await userEvent.click(screen.getByRole('button', { name: 'Delete this option' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Delete this option' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('keeps the confirm buttons usable when deleting fails', async () => {
    const onDelete = vi.fn().mockRejectedValueOnce(new Error('nope')).mockResolvedValue(undefined)
    renderIt('farro', { onDelete })
    await userEvent.click(screen.getByRole('button', { name: 'Delete this option' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save that. Try again?")
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(onDelete).toHaveBeenCalledTimes(2)
  })

  it('has no hide control', () => {
    renderIt('farro')
    expect(screen.queryByRole('button', { name: 'Hide this option' })).not.toBeInTheDocument()
  })
})

describe('OptionDetail for a built-in option', () => {
  it('shows the note as plain text', () => {
    renderIt('chicken')
    expect(screen.getByText('Juicy and forgiving')).toBeInTheDocument()
    expect(screen.getByText("Built-in notes can't be edited.")).toBeInTheDocument()
    expect(screen.queryByLabelText('Short note')).not.toBeInTheDocument()
  })

  it('locks built-in tips and lets the user delete their own', async () => {
    const onDeleteTip = vi.fn()
    renderIt('chicken', { onDeleteTip })
    expect(screen.getByText('Pat dry first.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete tip: Pat dry first.' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete tip: Marinate in yogurt.' }))
    expect(onDeleteTip).toHaveBeenCalledWith('t3')
  })

  it('has no clash editor and no delete control', () => {
    renderIt('chicken')
    expect(screen.queryByText("Doesn't go with")).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete this option' })).not.toBeInTheDocument()
  })

  it('hides the option', async () => {
    const onHide = vi.fn()
    renderIt('chicken', { onHide })
    await userEvent.click(screen.getByRole('button', { name: 'Hide this option' }))
    expect(onHide).toHaveBeenCalledTimes(1)
  })
})

describe('OptionDetail tips', () => {
  it('rejects a blank tip', async () => {
    const onAddTip = vi.fn()
    renderIt('chicken', { onAddTip })
    await userEvent.type(screen.getByLabelText('Add a tip for Chicken thighs'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Add tip' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Write a tip first')
    expect(onAddTip).not.toHaveBeenCalled()
  })

  it('adds a trimmed tip and clears the field', async () => {
    const onAddTip = vi.fn()
    renderIt('farro', { onAddTip })
    const field = screen.getByLabelText('Add a tip for Farro')
    await userEvent.type(field, '  Toast it first  ')
    await userEvent.click(screen.getByRole('button', { name: 'Add tip' }))
    expect(onAddTip).toHaveBeenCalledWith('Toast it first')
    expect(field).toHaveValue('')
  })

  it('shows an alert and keeps the text when adding fails, then allows a retry', async () => {
    const onAddTip = vi.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined)
    renderIt('farro', { onAddTip })
    const field = screen.getByLabelText('Add a tip for Farro')
    await userEvent.type(field, 'Toast it first')
    await userEvent.click(screen.getByRole('button', { name: 'Add tip' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save that. Try again?")
    expect(field).toHaveValue('Toast it first')
    await userEvent.click(screen.getByRole('button', { name: 'Add tip' }))
    expect(onAddTip).toHaveBeenCalledTimes(2)
    expect(field).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables Add tip while adding is pending', async () => {
    let finish: () => void = () => {}
    const onAddTip = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    renderIt('farro', { onAddTip })
    await userEvent.type(screen.getByLabelText('Add a tip for Farro'), 'Toast it first')
    const add = screen.getByRole('button', { name: 'Add tip' })
    await userEvent.click(add)
    expect(add).toBeDisabled()
    await userEvent.click(add)
    expect(onAddTip).toHaveBeenCalledTimes(1)
    await act(async () => { finish() })
    expect(add).toBeEnabled()
  })

  it('shows an alert when deleting a tip fails', async () => {
    const onDeleteTip = vi.fn().mockRejectedValue(new Error('nope'))
    renderIt('farro', { onDeleteTip })
    await userEvent.click(screen.getByRole('button', { name: 'Delete tip: Rinse first.' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save that. Try again?")
  })

  it('clears the note error once the note is edited', async () => {
    renderIt('farro')
    const note = screen.getByLabelText('Short note')
    await userEvent.clear(note)
    await userEvent.type(note, 'x'.repeat(41))
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await userEvent.type(note, 'y')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears the tip error once the tip is edited', async () => {
    renderIt('farro')
    await userEvent.click(screen.getByRole('button', { name: 'Add tip' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Write a tip first')
    await userEvent.type(screen.getByLabelText('Add a tip for Farro'), 'a')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not leave a tip error beside a later failure', async () => {
    const onDeleteTip = vi.fn().mockRejectedValue(new Error('nope'))
    renderIt('farro', { onDeleteTip })
    await userEvent.click(screen.getByRole('button', { name: 'Add tip' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete tip: Rinse first.' }))
    expect(await screen.findAllByRole('alert')).toHaveLength(1)
  })

  it('clears a failure when the delete confirmation is cancelled', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('nope'))
    renderIt('farro', { onDelete })
    await userEvent.click(screen.getByRole('button', { name: 'Delete this option' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
