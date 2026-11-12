import type { Picks, Step } from './types'

export const STEPS: Step[] = [
  { id: 'starch', name: 'Starch/Base', multi: false },
  { id: 'greens', name: 'Greens', multi: true },
  { id: 'protein', name: 'Protein', multi: false },
  { id: 'veggies', name: 'Filler Veggies', multi: true },
  { id: 'sauces', name: 'Sauces', multi: true },
  { id: 'garnish', name: 'Garnish/Texture', multi: true },
]

export function emptyPicks(): Picks {
  return { starch: [], greens: [], protein: [], veggies: [], sauces: [], garnish: [] }
}
