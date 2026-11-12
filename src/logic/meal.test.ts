import { buildMeal } from './meal'
import { buildMealName } from './name'
import { emptyPicks } from './steps'
import type { Catalog, Option, Picks, StepId } from './types'

function opt(id: string, stepId: StepId, name: string): Option {
  return { id, stepId, name, isCustom: false, hidden: false }
}

const catalog: Catalog = {
  options: [
    opt('rice', 'starch', 'Rice'),
    opt('chicken', 'protein', 'Chicken'),
    opt('spinach', 'greens', 'Spinach'),
    opt('kale', 'greens', 'Kale'),
    opt('ranch', 'sauces', 'Ranch'),
  ],
  pairs: [],
  tips: [
    { id: 't1', optionId: 'chicken', text: 'Season well', isCustom: false },
    { id: 't2', optionId: 'chicken', text: 'My tip', isCustom: true },
  ],
}

function picks(p: Partial<Picks>): Picks {
  return { ...emptyPicks(), ...p }
}

describe('buildMeal', () => {
  it('orders groups by step with step names, and items by pick order', () => {
    const meal = buildMeal(catalog, picks({
      sauces: ['ranch'], greens: ['kale', 'spinach'], starch: ['rice'],
    }))
    expect(meal.groups.map(g => g.stepName)).toEqual(['Starch/Base', 'Greens', 'Sauces'])
    expect(meal.groups[1].items.map(i => i.optionName)).toEqual(['Kale', 'Spinach'])
  })

  it('attaches tips to each item', () => {
    const meal = buildMeal(catalog, picks({ protein: ['chicken'], greens: ['kale'] }))
    expect(meal.groups.find(g => g.stepName === 'Protein')!.items)
      .toEqual([{ optionName: 'Chicken', tips: ['Season well', 'My tip'] }])
    expect(meal.groups.find(g => g.stepName === 'Greens')!.items)
      .toEqual([{ optionName: 'Kale', tips: [] }])
  })

  it('ignores unknown ids and omits a step with only unknown ids', () => {
    const meal = buildMeal(catalog, picks({ greens: ['gone', 'kale'], protein: ['gone'] }))
    expect(meal.groups.map(g => g.stepName)).toEqual(['Greens'])
    expect(meal.groups[0].items.map(i => i.optionName)).toEqual(['Kale'])
  })

  it('has no groups for empty picks', () => {
    expect(buildMeal(catalog, emptyPicks()).groups).toEqual([])
  })

  it('takes its name from buildMealName', () => {
    const p = picks({ starch: ['rice'], protein: ['chicken'] })
    expect(buildMeal(catalog, p).name).toBe(buildMealName(catalog, p))
  })
})
