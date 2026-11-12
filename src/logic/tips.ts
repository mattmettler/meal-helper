import type { Catalog } from './types'

export function tipsFor(catalog: Catalog, optionId: string): string[] {
  return catalog.tips.filter(t => t.optionId === optionId).map(t => t.text)
}
