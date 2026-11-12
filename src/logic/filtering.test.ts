import { availableOptions, prunePicks } from './filtering'
import { emptyPicks } from './steps'
import type { Catalog, Option, Picks, StepId } from './types'

function opt(id: string, stepId: StepId, hidden = false): Option {
  return { id, stepId, name: id, isCustom: false, hidden }
}

const catalog: Catalog = {
  options: [
    opt('rice', 'starch'),
    opt('quinoa', 'starch'),
    opt('kale', 'greens'),
    opt('spinach', 'greens'),
    opt('arugula', 'greens'),
    opt('tofu', 'protein'),
    opt('olives', 'veggies', true),
  ],
  pairs: [],
  tips: [],
}

function withPairs(...pairs: Array<[string, string]>): Catalog {
  return { ...catalog, pairs: pairs.map(([a, b]) => ({ a, b })) }
}

function picks(p: Partial<Picks>): Picks {
  return { ...emptyPicks(), ...p }
}

const ids = (options: Option[]) => options.map(o => o.id)

describe('availableOptions', () => {
  it('excludes hidden options', () => {
    expect(availableOptions(catalog, 'veggies', emptyPicks())).toEqual([])
  })

  it('excludes the later option when the pair is a-b', () => {
    const c = withPairs(['rice', 'kale'])
    expect(ids(availableOptions(c, 'greens', picks({ starch: ['rice'] })))).toEqual(['spinach', 'arugula'])
  })

  it('excludes the later option when the pair is b-a', () => {
    const c = withPairs(['kale', 'rice'])
    expect(ids(availableOptions(c, 'greens', picks({ starch: ['rice'] })))).toEqual(['spinach', 'arugula'])
  })

  it('excludes an option that clashes with an earlier pick in the same multi step', () => {
    const c = withPairs(['kale', 'spinach'])
    expect(ids(availableOptions(c, 'greens', picks({ greens: ['kale'] })))).toEqual(['kale', 'arugula'])
  })

  it('ignores pairs with options that are not picked', () => {
    const c = withPairs(['quinoa', 'kale'])
    expect(ids(availableOptions(c, 'greens', picks({ starch: ['rice'] })))).toEqual(['kale', 'spinach', 'arugula'])
  })

  it('ignores picks in later steps', () => {
    const c = withPairs(['tofu', 'rice'])
    expect(ids(availableOptions(c, 'starch', picks({ protein: ['tofu'] })))).toEqual(['rice', 'quinoa'])
  })

  it('returns an empty list when every option is excluded', () => {
    const c = withPairs(['rice', 'tofu'])
    expect(availableOptions(c, 'protein', picks({ starch: ['rice'] }))).toEqual([])
  })

  it('keeps an option already picked in this step', () => {
    const c = withPairs(['kale', 'spinach'])
    expect(ids(availableOptions(c, 'greens', picks({ greens: ['kale', 'arugula'] })))).toContain('kale')
  })
})

describe('prunePicks', () => {
  it('drops a later pick that clashes after an earlier pick changes', () => {
    const c = withPairs(['quinoa', 'kale'])
    const pruned = prunePicks(c, picks({ starch: ['quinoa'], greens: ['kale', 'spinach'] }))
    expect(pruned).toEqual(picks({ starch: ['quinoa'], greens: ['spinach'] }))
  })

  it('drops an id missing from the catalog', () => {
    expect(prunePicks(catalog, picks({ greens: ['ghost', 'kale'] }))).toEqual(picks({ greens: ['kale'] }))
  })

  it('drops a hidden option', () => {
    expect(prunePicks(catalog, picks({ veggies: ['olives'] }))).toEqual(emptyPicks())
  })

  it('keeps compatible picks in order', () => {
    const c = withPairs(['quinoa', 'tofu'])
    const input = picks({ starch: ['rice'], greens: ['spinach', 'kale'], protein: ['tofu'] })
    expect(prunePicks(c, input)).toEqual(input)
  })
})
