import { useState } from 'react'
import type { SavedMeal } from '../../logic/types'
import { MealGroups } from './MealGroups'

interface SavedDetailProps {
  meal: SavedMeal
  onDelete: (id: string) => void
  onBack: () => void
}

export function SavedDetail({ meal, onDelete, onBack }: SavedDetailProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <div className="top">
        <h1>{meal.name}</h1>
        <button className="back" onClick={onBack}>Back</button>
      </div>
      <MealGroups groups={meal.groups} />
      {confirming ? (
        <>
          <p className="nothing-fits">Delete this meal for good?</p>
          <button className="btn step-protein" onClick={() => onDelete(meal.id)}>Yes, delete</button>
          <button className="btn ghost" onClick={() => setConfirming(false)}>Cancel</button>
        </>
      ) : (
        <button className="btn ghost" onClick={() => setConfirming(true)}>Delete</button>
      )}
    </>
  )
}
