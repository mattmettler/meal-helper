import { useState } from 'react'
import { STEPS } from '../../logic/steps'
import type { Catalog } from '../../logic/types'
import { stepClass } from '../stepTheme'

interface HiddenOptionsProps {
  catalog: Catalog
  onRestore: (optionId: string) => void | Promise<void>
  onBack: () => void
}

export function HiddenOptions({ catalog, onRestore, onBack }: HiddenOptionsProps) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const hidden = catalog.options.filter(o => o.hidden && !o.isCustom)

  async function restore(optionId: string) {
    setPending(true)
    setFailed(false)
    try {
      await onRestore(optionId)
    } catch {
      setFailed(true)
    }
    setPending(false)
  }

  return (
    <>
      <div className="top">
        <h1>Hidden options</h1>
        <button className="back" onClick={onBack}>&lsaquo; Options</button>
      </div>
      <p className="hint">Hidden options don't show up when you build a meal. Their tips and clashes are kept, so restoring one brings everything back.</p>
      {hidden.length === 0 && <p className="nothing-fits">Nothing is hidden right now.</p>}
      {hidden.map(option => (
        <div key={option.id} className={`row ${stepClass(option.stepId)}`}>
          <div>
            <span className="name">{option.name}</span>
            <span className="when">{STEPS.find(s => s.id === option.stepId)?.name}</span>
          </div>
          <button className="restore" disabled={pending} onClick={() => restore(option.id)}>Restore</button>
        </div>
      ))}
      {failed && <p className="error" role="alert">Couldn't restore that. Try again?</p>}
    </>
  )
}
