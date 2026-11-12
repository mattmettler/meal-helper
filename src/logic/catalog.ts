import type { Catalog, Seed, UserData } from './types'

export function buildCatalog(seed: Seed, user: UserData): Catalog {
  const hidden = new Set(user.hiddenBuiltIns)
  return {
    options: [
      ...seed.options.map(o => ({ ...o, isCustom: false, hidden: hidden.has(o.id) })),
      ...user.customOptions.map(o => ({ ...o, isCustom: true, hidden: false })),
    ],
    pairs: [
      ...seed.pairs,
      ...user.userPairs.map(p => ({ a: p.optionIdA, b: p.optionIdB })),
    ],
    tips: [
      ...seed.tips.map(t => ({ ...t, isCustom: false })),
      ...user.userTips.map(t => ({ id: String(t.id), optionId: t.optionId, text: t.text, isCustom: true })),
    ],
  }
}
