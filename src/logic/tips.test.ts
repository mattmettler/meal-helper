import { tipsFor } from './tips'
import type { Catalog } from './types'

const catalog: Catalog = {
  options: [],
  pairs: [],
  tips: [
    { id: 't1', optionId: 'rice', text: 'Built-in one', isCustom: false },
    { id: 't2', optionId: 'kale', text: 'Kale tip', isCustom: false },
    { id: 't3', optionId: 'rice', text: 'Built-in two', isCustom: false },
    { id: 't4', optionId: 'rice', text: 'User one', isCustom: true },
    { id: 't5', optionId: 'rice', text: 'User two', isCustom: true },
  ],
}

describe('tipsFor', () => {
  it('returns built-in tips before user tips, each in catalog order', () => {
    expect(tipsFor(catalog, 'rice')).toEqual(['Built-in one', 'Built-in two', 'User one', 'User two'])
  })

  it('returns only the tips for that option', () => {
    expect(tipsFor(catalog, 'kale')).toEqual(['Kale tip'])
  })

  it('returns an empty list for an option with no tips', () => {
    expect(tipsFor(catalog, 'tofu')).toEqual([])
  })
})
