import type { SavedMeal } from '../../logic/types'
import { BackupReminder, type ReminderState } from './BackupReminder'

interface SavedProps {
  meals: SavedMeal[]
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  onOpen: (id: string) => void
  reminder: ReminderState
}

export function Saved({ meals, onToggleFavorite, onOpen, reminder }: SavedProps) {
  const favorites = meals.filter(m => m.isFavorite)
  const others = meals.filter(m => !m.isFavorite)

  function renderRow(meal: SavedMeal) {
    const when = new Date(meal.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return (
      <div key={meal.id} className="row">
        <button className="row-open" onClick={() => onOpen(meal.id)}>
          <span className="name">{meal.name}</span>
          <span className="when">Saved {when}</span>
        </button>
        <button
          className={`heart ${meal.isFavorite ? '' : 'off'}`}
          aria-label={`${meal.isFavorite ? 'Unfavorite' : 'Favorite'} ${meal.name}`}
          onClick={() => onToggleFavorite(meal.id, !meal.isFavorite)}
        >
          {meal.isFavorite ? '💛' : '🤍'}
        </button>
      </div>
    )
  }

  return (
    <>
      <h1>Saved meals</h1>
      <BackupReminder reminder={reminder} />
      {meals.length === 0 && <p className="nothing-fits">No saved meals yet</p>}
      {favorites.length > 0 && (
        <section>
          <h2 className="sect">Favorites</h2>
          {favorites.map(renderRow)}
        </section>
      )}
      {others.length > 0 && (
        <section>
          <h2 className="sect">Everything else</h2>
          {others.map(renderRow)}
        </section>
      )}
    </>
  )
}
