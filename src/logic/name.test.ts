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
    opt('peppers', 'veggies', 'Peppers'),
    opt('corn', 'veggies', 'Corn'),
    opt('ranch', 'sauces', 'Ranch'),
    opt('sesame', 'garnish', 'Sesame'),
  ],
  pairs: [],
  tips: [],
}

function picks(p: Partial<Picks>): Picks {
  return { ...emptyPicks(), ...p }
}

describe('buildMealName', () => {
  it('names starch plus a list', () => {
    expect(buildMealName(catalog, picks({ starch: ['rice'], protein: ['chicken'], greens: ['spinach'] })))
      .toBe('Rice Meal with Chicken and Spinach')
  })

  it('names a list without a starch', () => {
    expect(buildMealName(catalog, picks({ protein: ['chicken'], greens: ['spinach'] })))
      .toBe('Chicken and Spinach Meal')
  })

  it('names a single item', () => {
    expect(buildMealName(catalog, picks({ protein: ['chicken'] }))).toBe('Chicken Meal')
  })

  it('uses an Oxford comma for three items', () => {
    expect(buildMealName(catalog, picks({ protein: ['chicken'], greens: ['spinach'], veggies: ['peppers'] })))
      .toBe('Chicken, Spinach, and Peppers Meal')
  })

  it('shortens four items to three and more', () => {
    expect(buildMealName(catalog, picks({
      protein: ['chicken'], greens: ['spinach', 'kale'], veggies: ['peppers'],
    }))).toBe('Chicken, Spinach, Kale & more Meal')
  })

  it('lists protein, then greens, then veggies regardless of pick order', () => {
    expect(buildMealName(catalog, picks({ veggies: ['corn'], greens: ['kale'], protein: ['chicken'] })))
      .toBe('Chicken, Kale, and Corn Meal')
  })

  it('leaves sauces and garnish out of the name', () => {
    expect(buildMealName(catalog, picks({ protein: ['chicken'], sauces: ['ranch'], garnish: ['sesame'] })))
      .toBe('Chicken Meal')
  })

  it('names a starch with no list', () => {
    expect(buildMealName(catalog, picks({ starch: ['rice'] }))).toBe('Rice Meal')
  })

  it('falls back to Meal when nothing is nameable', () => {
    expect(buildMealName(catalog, emptyPicks())).toBe('Meal')
    expect(buildMealName(catalog, picks({ sauces: ['ranch'] }))).toBe('Meal')
  })
})
