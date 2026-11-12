import { STEPS, emptyPicks } from './steps'

describe('steps', () => {
  it('STEPS lists the six steps in order', () => {
    expect(STEPS.map((s) => s.id)).toEqual(['starch', 'greens', 'protein', 'veggies', 'sauces', 'garnish'])
    expect(STEPS.map((s) => s.name)).toEqual([
      'Starch/Base',
      'Greens',
      'Protein',
      'Filler Veggies',
      'Sauces',
      'Garnish/Texture',
    ])
  })

  it('only Starch/Base and Protein are single-select', () => {
    expect(STEPS.map((s) => s.multi)).toEqual([false, true, false, true, true, true])
  })

  it('emptyPicks has an empty array for every step', () => {
    expect(emptyPicks()).toEqual({ starch: [], greens: [], protein: [], veggies: [], sauces: [], garnish: [] })
  })
})
