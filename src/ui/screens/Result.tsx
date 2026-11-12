import { useState } from 'react'
import { STEPS } from '../../logic/steps'
import type { Meal } from '../../logic/types'
import { stepClass } from '../stepTheme'

interface ResultProps {
  meal: Meal
  onSave: (meal: Meal) => void
  saveFailed: boolean
  onDiscard: () => void
}

export function Result({ meal, onSave, saveFailed, onDiscard }: ResultProps) {
  const [name, setName] = useState(meal.name)

  return (
    <>
      <h1>Your meal</h1>
      {meal.groups.map(group => {
        const step = STEPS.find(s => s.name === group.stepName)
        return (
          <div key={group.stepName} className={`card ${step ? stepClass(step.id) : ''}`}>
            <span className="group-label">{group.stepName}</span>
            {group.items.map(item => (
              <div key={item.optionName}>
                <div className="pick">{item.optionName}</div>
                {item.tips.map(tip => <p key={tip} className="tip">{tip}</p>)}
              </div>
            ))}
          </div>
        )
      })}
      <label className="small" htmlFor="meal-name">Name your meal</label>
      <input id="meal-name" className="field" value={name} onChange={e => setName(e.target.value)} />
      {saveFailed && <p role="alert" className="nothing-fits">Couldn't save that one. Try again?</p>}
      <button className="btn step-greens" onClick={() => onSave({ ...meal, name: name.trim() || meal.name })}>Save this meal</button>
      <button className="btn ghost" onClick={onDiscard}>Discard</button>
    </>
  )
}
