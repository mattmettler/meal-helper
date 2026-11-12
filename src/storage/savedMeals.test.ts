import { createDb } from './db'
import { deleteSavedMeal, listSavedMeals, saveMeal, setFavorite } from './savedMeals'
import { addCustomOption, addUserTip, deleteCustomOption, deleteUserTip, loadUserData } from './userData'
import type { Meal } from '../logic/types'

let counter = 0
function freshName() {
  counter += 1
  return `saved-meals-db-${counter}-${Date.now()}`
}

function mealNamed(name: string): Meal {
  return { name, groups: [{ stepName: 'Starch', items: [{ optionName: 'Rice', tips: ['Toast it first'] }] }] }
}

describe('saved meals', () => {
  it('stores the snapshot text and starts unfavorited', async () => {
    const db = createDb(freshName())
    const meal = mealNamed('Cozy Rice Bowl')
    const id = await saveMeal(db, meal, 1000)
    expect(await listSavedMeals(db)).toEqual([{ ...meal, id, isFavorite: false, createdAt: 1000 }])
    db.close()
  })

  it('is unchanged after a custom option and a user tip are deleted', async () => {
    const db = createDb(freshName())
    const optionId = await addCustomOption(db, { stepId: 'sauces', name: 'Chili crisp' })
    await addUserTip(db, 'rice', 'Rinse it')
    await addUserTip(db, optionId, 'Use sparingly')
    const meal: Meal = {
      name: 'Spicy',
      groups: [{ stepName: 'Sauces', items: [{ optionName: 'Chili crisp', tips: ['Use sparingly', 'Rinse it'] }] }],
    }
    const id = await saveMeal(db, meal)
    const tipIds = (await loadUserData(db)).userTips.map((tip) => String(tip.id))
    await deleteUserTip(db, tipIds[0])
    await deleteCustomOption(db, optionId)
    expect(await listSavedMeals(db)).toEqual([expect.objectContaining({ id, ...meal })])
    db.close()
  })

  it('lists favorites first, then newest first', async () => {
    const db = createDb(freshName())
    const oldPlain = await saveMeal(db, mealNamed('old plain'), 1)
    const oldFav = await saveMeal(db, mealNamed('old fav'), 2)
    const newPlain = await saveMeal(db, mealNamed('new plain'), 3)
    const newFav = await saveMeal(db, mealNamed('new fav'), 4)
    await setFavorite(db, oldFav, true)
    await setFavorite(db, newFav, true)
    expect((await listSavedMeals(db)).map((meal) => meal.id)).toEqual([newFav, oldFav, newPlain, oldPlain])
    db.close()
  })

  it('keeps a favorite across close and reopen', async () => {
    const name = freshName()
    const db = createDb(name)
    const id = await saveMeal(db, mealNamed('Keeper'))
    await setFavorite(db, id, true)
    db.close()

    const reopened = createDb(name)
    expect((await listSavedMeals(reopened))[0].isFavorite).toBe(true)
    await setFavorite(reopened, id, false)
    expect((await listSavedMeals(reopened))[0].isFavorite).toBe(false)
    reopened.close()
  })

  it('deletes only the chosen meal', async () => {
    const db = createDb(freshName())
    const first = await saveMeal(db, mealNamed('first'), 1)
    const second = await saveMeal(db, mealNamed('second'), 2)
    await deleteSavedMeal(db, first)
    expect((await listSavedMeals(db)).map((meal) => meal.id)).toEqual([second])
    db.close()
  })
})
