import { useMemo, useState } from 'react'
import { TOO_THIN_MESSAGE } from '../../logic/copy'
import { availableOptions, prunePicks } from '../../logic/filtering'
import { buildMeal } from '../../logic/meal'
import { STEPS, emptyPicks } from '../../logic/steps'
import type { Catalog, Meal } from '../../logic/types'
import { validateMeal } from '../../logic/validate'
import { stepClass } from '../stepTheme'
import { Logo } from '../Logo'
import { Result } from './Result'

interface BuildProps {
  catalog: Catalog
  onSave: (meal: Meal) => void | Promise<void>
}

type Phase = 'building' | 'result' | 'too-thin'

export function Build({ catalog, onSave }: BuildProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rawPicks, setPicks] = useState(emptyPicks)
  const [phase, setPhase] = useState<Phase>('building')
  const [saveFailed, setSaveFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const picks = useMemo(() => prunePicks(catalog, rawPicks), [catalog, rawPicks])

  const step = STEPS[stepIndex]
  const options = availableOptions(catalog, step.id, picks)
  const stepPicks = picks[step.id]
  const isLast = stepIndex === STEPS.length - 1

  function startOver() {
    setStepIndex(0)
    setPicks(emptyPicks())
    setPhase('building')
    setSaveFailed(false)
  }

  async function save(meal: Meal) {
    setSaving(true)
    try {
      await onSave(meal)
    } catch {
      setSaveFailed(true)
      return
    } finally {
      setSaving(false)
    }
    startOver()
  }

  function toggle(optionId: string) {
    const picked = stepPicks.includes(optionId)
    const next = picked
      ? stepPicks.filter(id => id !== optionId)
      : step.multi ? [...stepPicks, optionId] : [optionId]
    setPicks(prunePicks(catalog, { ...picks, [step.id]: next }))
  }

  function advance() {
    if (!isLast) setStepIndex(stepIndex + 1)
    else setPhase(validateMeal(picks) === 'ok' ? 'result' : 'too-thin')
  }

  if (phase === 'result') {
    return (
      <Result
        meal={buildMeal(catalog, picks)}
        onSave={save}
        saveFailed={saveFailed}
        saving={saving}
        onDiscard={startOver}
      />
    )
  }

  if (phase === 'too-thin') {
    return (
      <div className="center">
        <Logo large />
        <h2>{TOO_THIN_MESSAGE}</h2>
        <button className="btn step-protein" onClick={startOver}>Start over</button>
      </div>
    )
  }

  const primaryLabel = isLast ? 'Finish' : stepPicks.length ? 'Next' : 'Skip'

  return (
    <div className={stepClass(step.id)}>
      <div className="top">
        <Logo />
        <h1>Build a meal</h1>
        {stepIndex > 0 && <button className="back" onClick={() => setStepIndex(stepIndex - 1)}>&lsaquo; Back</button>}
      </div>
      <div className="progress">
        {STEPS.map((s, i) => (
          <i key={s.id} className={`${stepClass(s.id)} ${i < stepIndex ? 'done' : i === stepIndex ? 'now' : ''}`} />
        ))}
      </div>
      <div className="stepcount">Step {stepIndex + 1} of {STEPS.length}</div>
      <div className="bubble">
        <h2>{step.name}</h2>
        <p>{step.multi ? 'Pick as many as you like, or skip.' : 'Pick one, or skip.'}</p>
      </div>
      {options.length === 0 && <p className="nothing-fits">Nothing fits with your picks, skip ahead</p>}
      <div className="chips grid">
        {options.map(option => (
          <button
            key={option.id}
            className="chip"
            aria-pressed={stepPicks.includes(option.id)}
            onClick={() => toggle(option.id)}
          >
            <b>{option.name}</b>
            {option.note && <small>{option.note}</small>}
          </button>
        ))}
      </div>
      <div className="footer">
        <button className="btn" onClick={advance}>{primaryLabel}</button>
      </div>
    </div>
  )
}
