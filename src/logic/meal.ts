import { buildMealName } from './name'
import { STEPS } from './steps'
import { tipsFor } from './tips'
import type { Catalog, Meal, MealGroup, Picks } from './types'

export function buildMeal(catalog: Catalog, picks: Picks): Meal {
  const groups: MealGroup[] = []
  for (const step of STEPS) {
    const items = picks[step.id].flatMap(id => {
      const option = catalog.options.find(o => o.id === id)
      return option ? [{ optionName: option.name, tips: tipsFor(catalog, id) }] : []
    })
    if (items.length) groups.push({ stepName: step.name, items })
  }
  return { name: buildMealName(catalog, picks), groups }
}
