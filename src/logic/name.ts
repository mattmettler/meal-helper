import type { Catalog, Picks, StepId } from './types'

const LIST_STEPS: StepId[] = ['protein', 'greens', 'veggies']
const MAX_LISTED = 3

function namesFor(catalog: Catalog, ids: string[]): string[] {
  return ids.flatMap(id => catalog.options.find(o => o.id === id)?.name ?? [])
}

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  if (names.length === MAX_LISTED) return `${names[0]}, ${names[1]}, and ${names[2]}`
  return `${names.slice(0, MAX_LISTED).join(', ')} & more`
}

export function buildMealName(catalog: Catalog, picks: Picks): string {
  const [starch] = namesFor(catalog, picks.starch)
  const listed = namesFor(catalog, LIST_STEPS.flatMap(step => picks[step]))
  if (starch && listed.length) return `${starch} Meal with ${joinNames(listed)}`
  if (starch) return `${starch} Meal`
  if (listed.length) return `${joinNames(listed)} Meal`
  return 'Meal'
}
