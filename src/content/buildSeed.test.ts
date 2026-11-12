import { buildSeed } from './seed'
import type { SeedEntry } from './seed'
import type { StepId } from '../logic/types'

const table = (overrides: Partial<Record<StepId, SeedEntry[]>>): Record<StepId, SeedEntry[]> => ({
  starch: [], greens: [], protein: [], veggies: [], sauces: [], garnish: [], ...overrides,
})

describe('buildSeed', () => {
  it('throws naming a display name used in two steps', () => {
    const entries = table({
      veggies: [{ name: 'Avocado', tips: ['a'] }],
      garnish: [{ name: 'Avocado', tips: ['b'] }],
    })
    expect(() => buildSeed(entries)).toThrow(/"Avocado"/)
  })

  it('throws naming a display name used twice in one step', () => {
    const entries = table({ greens: [{ name: 'Kale', tips: ['a'] }, { name: 'Kale', tips: ['b'] }] })
    expect(() => buildSeed(entries)).toThrow(/"Kale"/)
  })

  it('throws naming the id when two names in a step reduce to the same id', () => {
    const entries = table({ greens: [{ name: 'Bok choy', tips: ['a'] }, { name: 'Bok-choy', tips: ['b'] }] })
    expect(() => buildSeed(entries)).toThrow(/"greens\.bok-choy"/)
  })

  it('uses an explicit id for the option and its tips, and keeps it when the name changes', () => {
    const build = (name: string) =>
      buildSeed(table({ greens: [{ name, id: 'greens.kale', tips: ['one', 'two'] }] }))
    for (const name of ['Old name', 'New name']) {
      const seed = build(name)
      expect(seed.options.map(o => o.id)).toEqual(['greens.kale'])
      expect(seed.options[0].name).toBe(name)
      expect(seed.tips.map(t => t.id)).toEqual(['greens.kale#1', 'greens.kale#2'])
    }
  })

  it('resolves a clash by display name to the right ids, once', () => {
    const seed = buildSeed(table({
      greens: [{ name: 'Bok choy', tips: ['a'], doesntGoWith: ['Pesto'] }],
      sauces: [{ name: 'Pesto', id: 'sauces.basil-pesto', tips: ['b'], doesntGoWith: ['Bok choy'] }],
    }))
    expect(seed.pairs).toEqual([{ a: 'greens.bok-choy', b: 'sauces.basil-pesto' }])
  })
})
