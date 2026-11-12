import { SEED } from './seed'
import { availableOptions } from '../logic/filtering'
import { buildCatalog } from '../logic/catalog'
import { STEPS, emptyPicks } from '../logic/steps'
import type { UserData } from '../logic/types'

const noUserData: UserData = { customOptions: [], hiddenBuiltIns: [], userPairs: [], userTips: [] }
const optionIds = new Set(SEED.options.map(o => o.id))
const forbiddenWord = /\b(bowl|recipe)\b/i
const quantity = /\d|\b(cups?|tablespoons?|teaspoons?|tbsp|tsp|ounces?|oz|grams?|pounds?|lbs?|degrees?|pinch|splash|dash|handful)\b/i

describe('seed content', () => {
  it('has unique ids, and each option id starts with its step id and a dot', () => {
    const ids = [...SEED.options.map(o => o.id), ...SEED.tips.map(t => t.id)]
    expect(new Set(ids).size).toBe(ids.length)
    for (const o of SEED.options) expect(o.id.startsWith(`${o.stepId}.`)).toBe(true)
  })

  it('has 6 to 10 options per step', () => {
    for (const step of STEPS) {
      const count = SEED.options.filter(o => o.stepId === step.id).length
      expect(count, step.name).toBeGreaterThanOrEqual(6)
      expect(count, step.name).toBeLessThanOrEqual(10)
    }
  })

  it('has pairs of two different existing options with no duplicates', () => {
    const seen = new Set<string>()
    for (const p of SEED.pairs) {
      expect(optionIds.has(p.a), p.a).toBe(true)
      expect(optionIds.has(p.b), p.b).toBe(true)
      expect(p.a).not.toBe(p.b)
      const key = [p.a, p.b].sort().join('|')
      expect(seen.has(key), key).toBe(false)
      seen.add(key)
    }
  })

  it('gives every option 1 or 2 tips with text, and every tip an existing option', () => {
    for (const t of SEED.tips) {
      expect(optionIds.has(t.optionId), t.id).toBe(true)
      expect(t.text.trim().length, t.id).toBeGreaterThan(0)
    }
    for (const o of SEED.options) {
      const count = SEED.tips.filter(t => t.optionId === o.id).length
      expect(count, o.id).toBeGreaterThanOrEqual(1)
      expect(count, o.id).toBeLessThanOrEqual(2)
    }
  })

  it.each(SEED.tips.map(t => [t.id, t.text]))('tip %s has no quantities', (_id, text) => {
    expect(text).not.toMatch(quantity)
  })

  it('keeps notes within 40 characters and requires them for sauces and garnishes', () => {
    for (const o of SEED.options) {
      if (o.note !== undefined) expect(o.note.length, o.id).toBeLessThanOrEqual(40)
      if (o.stepId === 'sauces' || o.stepId === 'garnish') expect(o.note, o.id).toBeTruthy()
    }
  })

  it('never uses the words bowl or recipe', () => {
    for (const o of SEED.options) expect(`${o.name} ${o.note ?? ''}`, o.id).not.toMatch(forbiddenWord)
    for (const t of SEED.tips) expect(t.text, t.id).not.toMatch(forbiddenWord)
  })

  it('never lets a single pick leave a later step empty', () => {
    const catalog = buildCatalog(SEED, noUserData)
    for (const o of SEED.options) {
      const picks = { ...emptyPicks(), [o.stepId]: [o.id] }
      const later = STEPS.slice(STEPS.findIndex(s => s.id === o.stepId) + 1)
      for (const step of later) {
        expect(availableOptions(catalog, step.id, picks).length, `${o.id} empties ${step.id}`).toBeGreaterThan(0)
      }
    }
  })
})
