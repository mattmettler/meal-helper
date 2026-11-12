import { useState } from 'react'
import { NOTE_MAX_LENGTH, validateOptionInput } from '../../logic/inputRules'
import { STEPS } from '../../logic/steps'
import type { StepId } from '../../logic/types'
import { stepClass } from '../stepTheme'

interface OptionAddProps {
  initialStepId?: StepId
  initialName?: string
  initialNote?: string
  onNext: (input: { stepId: StepId; name: string; note?: string }) => void
  onBack: () => void
}

export function OptionAdd({ initialStepId = 'starch', initialName = '', initialNote = '', onNext, onBack }: OptionAddProps) {
  const [stepId, setStepId] = useState<StepId>(initialStepId)
  const [name, setName] = useState(initialName)
  const [note, setNote] = useState(initialNote)
  const [error, setError] = useState<string | null>(null)

  function next() {
    const message = validateOptionInput({ name, note })
    setError(message)
    if (message) return
    onNext({ stepId, name: name.trim(), note: note.trim() || undefined })
  }

  return (
    <div className={stepClass(stepId)}>
      <div className="top">
        <h1>Add an option</h1>
        <button className="back" onClick={onBack}>&lsaquo; Options</button>
      </div>
      <div className="label small">Which step?</div>
      <div className="steppicker">
        {STEPS.map(s => (
          <button
            key={s.id}
            className={`pill ${stepClass(s.id)}`}
            aria-pressed={s.id === stepId}
            onClick={() => setStepId(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <label className="small" htmlFor="option-name">Name</label>
      <input id="option-name" className="field" value={name} onChange={e => setName(e.target.value)} />
      <label className="small" htmlFor="option-note">Short note (optional)</label>
      <input
        id="option-note"
        className="field"
        style={{ marginBottom: 6 }}
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <div className="counter">{note.length} / {NOTE_MAX_LENGTH}</div>
      {error && <p className="error" role="alert">{error}</p>}
      <div>
        <div className="label small">How it will look</div>
        <div className="chips grid">
          <div className="chip selected">
            <b>{name.trim() || 'Your option'}</b>
            {note.trim() && <small>{note.trim()}</small>}
          </div>
        </div>
      </div>
      <div className="footer">
        <button className="btn" onClick={next}>Next: what doesn't it go with?</button>
      </div>
    </div>
  )
}
