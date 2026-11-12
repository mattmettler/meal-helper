import type { Meal, SavedMeal } from '../logic/types'
import type { MealGuideDb } from './db'

export async function saveMeal(db: MealGuideDb, meal: Meal, now = Date.now()): Promise<string> {
  const id = crypto.randomUUID()
  await db.savedMeals.add({ ...meal, id, isFavorite: false, createdAt: now })
  return id
}

export async function listSavedMeals(db: MealGuideDb): Promise<SavedMeal[]> {
  const meals = await db.savedMeals.toArray()
  return meals.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.createdAt - a.createdAt)
}

export async function setFavorite(db: MealGuideDb, id: string, isFavorite: boolean): Promise<void> {
  await db.savedMeals.update(id, { isFavorite })
}

export async function deleteSavedMeal(db: MealGuideDb, id: string): Promise<void> {
  await db.savedMeals.delete(id)
}
