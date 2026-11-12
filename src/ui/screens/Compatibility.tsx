import { useState } from 'react'
import { STEPS } from '../../logic/steps'
import type { Catalog, StepId } from '../../logic/types'
import { stepClass } from '../stepTheme'
import { Logo } from '../Logo'

interface CompatibilityProps {
  catalog: Catalog
  optionName: string
  stepId: StepId
  initialChecked: string[]
  excludeOptionId?: string
  onSave: (checkedIds: string[]) => void | Promise<void>
  onBack: () => void
}

export function Compatibility({ catalog, optionName, stepId, initialChecked, excludeOptionId, onSave, onBack }: CompatibilityProps) {
  const [checked, setChecked] = useState(initialChecked)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  async function save() {
    setSaving(true)
    setSaveFailed(false)
    try {
      await onSave(checked)
    } catch {
      setSaveFailed(true)
    }
    setSaving(false)
  }

  function toggle(optionId: string) {
    setChecked(checked.includes(optionId) ? checked.filter(id => id !== optionId) : [...checked, optionId])
  }

  return (
    <div className={stepClass(stepId)}>
      <div className="top">
        <Logo />
        <h1>{optionName}</h1>
        <button className="back" onClick={onBack}>&lsaquo; Back</button>
      </div>
      <div className="bubble">
        <h2>Doesn't go with?</h2>
        <p>Check anything that clashes with {optionName}. Leave it blank if nothing does.</p>
      </div>
      {STEPS.map(step => {
        const options = catalog.options.filter(o => o.stepId === step.id && !o.hidden && o.id !== excludeOptionId)
        if (options.length === 0) return null
        return (
          <div key={step.id} className={`optgroup ${stepClass(step.id)}`}>
            <span className="group-label">{step.name}</span>
            {options.map(option => (
              <label key={option.id} className={`checkrow ${checked.includes(option.id) ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked.includes(option.id)}
                  onChange={() => toggle(option.id)}
                />
                <span className="box" aria-hidden="true" />
                {option.name}
              </label>
            ))}
          </div>
        )
      })}
      {saveFailed && <p className="error" role="alert">Couldn't save that option. Try again?</p>}
      <div className="footer">
        <button className="btn" disabled={saving} onClick={save}>Save option ({checked.length} checked)</button>
      </div>
    </div>
  )
}
