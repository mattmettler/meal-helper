import { useState } from 'react'
import { NOTE_MAX_LENGTH, validateOptionInput, validateTipText } from '../../logic/inputRules'
import { STEPS } from '../../logic/steps'
import type { Catalog } from '../../logic/types'
import { stepClass } from '../stepTheme'
import { Logo } from '../Logo'

interface OptionDetailProps {
  catalog: Catalog
  optionId: string
  onSaveNote: (note?: string) => void | Promise<void>
  onEditClashes: () => void
  onAddTip: (text: string) => void | Promise<void>
  onDeleteTip: (tipId: string) => void | Promise<void>
  onHide: () => void | Promise<void>
  onDelete: () => void | Promise<void>
  onBack: () => void
}

export function OptionDetail({
  catalog, optionId, onSaveNote, onEditClashes, onAddTip, onDeleteTip, onHide, onDelete, onBack,
}: OptionDetailProps) {
  const option = catalog.options.find(o => o.id === optionId)
  const [note, setNote] = useState(option?.note ?? '')
  const [tipText, setTipText] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)
  const [tipError, setTipError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!option) return null

  const stepName = STEPS.find(s => s.id === option.stepId)?.name
  const tips = catalog.tips.filter(t => t.optionId === option.id)
  const builtInTips = tips.filter(t => !t.isCustom)
  const userTips = tips.filter(t => t.isCustom)
  const clashNames = catalog.pairs
    .filter(p => p.a === option.id || p.b === option.id)
    .map(p => catalog.options.find(o => o.id === (p.a === option.id ? p.b : p.a))?.name)
    .filter((name): name is string => name !== undefined)

  async function run(action: () => void | Promise<void>): Promise<boolean> {
    setPending(true)
    setFailed(false)
    setNoteError(null)
    setTipError(null)
    try {
      await action()
      return true
    } catch {
      setFailed(true)
      return false
    } finally {
      setPending(false)
    }
  }

  async function saveNote() {
    const message = validateOptionInput({ name: option!.name, note })
    setNoteError(message)
    if (message) return
    await run(() => onSaveNote(note.trim() || undefined))
  }

  async function addTip() {
    const message = validateTipText(tipText)
    setTipError(message)
    if (message) return
    if (await run(() => onAddTip(tipText.trim()))) setTipText('')
  }

  return (
    <div className={stepClass(option.stepId)}>
      <div className="top">
        <Logo />
        <h1>{option.name}</h1>
        <button className="back" onClick={onBack}>&lsaquo; Options</button>
      </div>
      <div className="card">
        <span className="group-label">{stepName}</span>
        <span className={`badge ${option.isCustom ? '' : 'solid'}`}>{option.isCustom ? 'custom' : 'built in'}</span>
        {option.isCustom ? (
          <>
            <label className="small" htmlFor="option-note">Short note</label>
            <input
              id="option-note"
              className="field"
              style={{ marginBottom: 0 }}
              value={note}
              onChange={e => { setNote(e.target.value); setNoteError(null) }}
            />
            <div className="counter">{note.length} / {NOTE_MAX_LENGTH}</div>
            {noteError && <p className="error" role="alert">{noteError}</p>}
            <button className="btn" disabled={pending} onClick={saveNote}>Save note</button>
          </>
        ) : (
          <>
            {option.note && <div className="pick">{option.note}</div>}
            <p className="hint">Built-in notes can't be edited.</p>
          </>
        )}
      </div>
      {option.isCustom && (
        <div className="card">
          <div className="linkrow">
            Doesn't go with
            <button className="back" disabled={pending} onClick={onEditClashes}>Edit &rsaquo;</button>
          </div>
          <p className="hint">{clashNames.length > 0 ? clashNames.join(', ') : 'Nothing yet'}</p>
        </div>
      )}
      {builtInTips.length > 0 && (
        <>
          <div className="sect">Built-in tips</div>
          {builtInTips.map(tip => (
            <div key={tip.id} className="tiprow locked">
              <span>{tip.text}</span>
              <span role="img" aria-label="Locked">&#128274;</span>
            </div>
          ))}
        </>
      )}
      <div className="sect">Your tips</div>
      {userTips.map(tip => (
        <div key={tip.id} className="tiprow">
          <span>{tip.text}</span>
          <button
            className="x"
            aria-label={`Delete tip: ${tip.text}`}
            disabled={pending}
            onClick={() => run(() => onDeleteTip(tip.id))}
          >
            &#10005;
          </button>
        </div>
      ))}
      <textarea
        className="field"
        aria-label={`Add a tip for ${option.name}`}
        placeholder={`Add a tip for ${option.name}`}
        value={tipText}
        onChange={e => { setTipText(e.target.value); setTipError(null) }}
      />
      <button className="btn" disabled={pending} onClick={addTip}>Add tip</button>
      {tipError && <p className="error" role="alert">{tipError}</p>}
      {failed && <p className="error" role="alert">Couldn't save that. Try again?</p>}
      {option.isCustom ? (
        confirmingDelete ? (
          <>
            <p className="nothing-fits">Delete this option for good? Its tips and clashes go too.</p>
            <button className="btn step-protein" disabled={pending} onClick={() => run(onDelete)}>Yes, delete</button>
            <button className="btn ghost" disabled={pending} onClick={() => { setConfirmingDelete(false); setFailed(false) }}>Cancel</button>
          </>
        ) : (
          <button className="btn ghost" disabled={pending} onClick={() => setConfirmingDelete(true)}>Delete this option</button>
        )
      ) : (
        <button className="btn ghost" disabled={pending} onClick={() => run(onHide)}>Hide this option</button>
      )}
    </div>
  )
}
