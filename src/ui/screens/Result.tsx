import { useState } from 'react'
import type { Meal } from '../../logic/types'
import { Logo } from '../Logo'
import { MealGroups } from './MealGroups'

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
      <div className="top">
        <Logo />
        <h1>Your meal</h1>
      </div>
      <MealGroups groups={meal.groups} />
      <label className="small" htmlFor="meal-name">Name your meal</label>
      <input id="meal-name" className="field" value={name} onChange={e => setName(e.target.value)} />
      {saveFailed && <p role="alert" className="nothing-fits">Couldn't save that one. Try again?</p>}
      <button className="btn step-greens" onClick={() => onSave({ ...meal, name: name.trim() || meal.name })}>Save this meal</button>
      <button className="btn ghost" onClick={onDiscard}>Discard</button>
    </>
  )
}
