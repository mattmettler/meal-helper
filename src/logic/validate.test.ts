import { emptyPicks, STEPS } from './steps'
import { TOO_THIN_MESSAGE } from './copy'
import { validateMeal } from './validate'
import type { Picks, StepId } from './types'

function picksOf(partial: Partial<Record<StepId, number>>): Picks {
  const picks = emptyPicks()
  for (const step of STEPS) {
    picks[step.id] = Array.from({ length: partial[step.id] ?? 0 }, () => 'x')
  }
  return picks
}

describe('TOO_THIN_MESSAGE', () => {
  it('is the exact approved copy', () => {
    expect(TOO_THIN_MESSAGE).toBe("You've got to eat something and I know you can do better than that <3 Give it another try!")
  })
})

describe('validateMeal', () => {
  it('no picks is too thin', () => {
    expect(validateMeal(emptyPicks())).toBe('too-thin')
  })

  it.each(STEPS.map((s) => s.id))('picks from only %s are too thin', (id) => {
    expect(validateMeal(picksOf({ [id]: 1 }))).toBe('too-thin')
  })

  it('two greens only is too thin', () => {
    expect(validateMeal(picksOf({ greens: 2 }))).toBe('too-thin')
  })

  it.each([
    ['veggies and sauces', { veggies: 1, sauces: 1 }],
    ['sauces and garnish', { sauces: 1, garnish: 1 }],
    ['veggies and garnish', { veggies: 1, garnish: 1 }],
    ['veggies, sauces, and garnish', { veggies: 1, sauces: 1, garnish: 1 }],
  ] as const)('only filler veggies, sauces, and garnish is too thin: %s', (_label, partial) => {
    expect(validateMeal(picksOf(partial))).toBe('too-thin')
  })

  it.each([
    ['greens and sauces', { greens: 1, sauces: 1 }],
    ['starch and protein', { starch: 1, protein: 1 }],
    ['protein and garnish', { protein: 1, garnish: 1 }],
    ['greens and veggies', { greens: 1, veggies: 1 }],
    ['starch, greens, and protein', { starch: 1, greens: 1, protein: 1 }],
  ] as const)('ok: %s', (_label, partial) => {
    expect(validateMeal(picksOf(partial))).toBe('ok')
  })
})
