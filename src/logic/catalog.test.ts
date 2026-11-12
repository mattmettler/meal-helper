import { buildCatalog } from './catalog'
import type { Seed, UserData } from './types'

const seed: Seed = {
  options: [
    { id: 'rice', stepId: 'starch', name: 'Rice', note: 'fluffy' },
    { id: 'kale', stepId: 'greens', name: 'Kale' },
  ],
  pairs: [{ a: 'rice', b: 'kale' }],
  tips: [
    { id: 't1', optionId: 'rice', text: 'Rinse first' },
    { id: 't2', optionId: 'kale', text: 'Massage it' },
  ],
}

const noUser: UserData = { customOptions: [], hiddenBuiltIns: [], userPairs: [], userTips: [] }

describe('buildCatalog', () => {
  it('lists built-in options then custom options with isCustom set', () => {
    const user: UserData = {
      ...noUser,
      customOptions: [{ id: 'c1', stepId: 'garnish', name: 'Crispy onions', note: 'crunchy' }],
    }
    const { options } = buildCatalog(seed, user)
    expect(options).toEqual([
      { id: 'rice', stepId: 'starch', name: 'Rice', note: 'fluffy', isCustom: false, hidden: false },
      { id: 'kale', stepId: 'greens', name: 'Kale', isCustom: false, hidden: false },
      { id: 'c1', stepId: 'garnish', name: 'Crispy onions', note: 'crunchy', isCustom: true, hidden: false },
    ])
  })

  it('hides built-in options listed in hiddenBuiltIns', () => {
    const { options } = buildCatalog(seed, { ...noUser, hiddenBuiltIns: ['kale'] })
    expect(options.find(o => o.id === 'kale')?.hidden).toBe(true)
    expect(options.find(o => o.id === 'rice')?.hidden).toBe(false)
  })

  it('never hides a custom option', () => {
    const user: UserData = {
      ...noUser,
      customOptions: [{ id: 'c1', stepId: 'garnish', name: 'Crispy onions' }],
      hiddenBuiltIns: ['c1'],
    }
    expect(buildCatalog(seed, user).options.find(o => o.id === 'c1')?.hidden).toBe(false)
  })

  it('combines seed pairs and user pairs', () => {
    const user: UserData = { ...noUser, userPairs: [{ id: 'p1', optionIdA: 'c1', optionIdB: 'rice' }] }
    expect(buildCatalog(seed, user).pairs).toEqual([
      { a: 'rice', b: 'kale' },
      { a: 'c1', b: 'rice' },
    ])
  })

  it('combines seed tips then user tips with isCustom and string ids', () => {
    const user: UserData = {
      ...noUser,
      userTips: [
        { id: 7, optionId: 'rice', text: 'Add butter' },
        { id: 9, optionId: 'kale', text: 'Lemon helps' },
      ],
    }
    expect(buildCatalog(seed, user).tips).toEqual([
      { id: 't1', optionId: 'rice', text: 'Rinse first', isCustom: false },
      { id: 't2', optionId: 'kale', text: 'Massage it', isCustom: false },
      { id: '7', optionId: 'rice', text: 'Add butter', isCustom: true },
      { id: '9', optionId: 'kale', text: 'Lemon helps', isCustom: true },
    ])
  })
})
