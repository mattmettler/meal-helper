import { STEPS, emptyPicks } from './steps'
import type { Catalog, Option, Picks, StepId } from './types'

function clashes(catalog: Catalog, optionId: string, pickedId: string): boolean {
  return catalog.pairs.some(p => (p.a === optionId && p.b === pickedId) || (p.b === optionId && p.a === pickedId))
}

function earlierPicks(picks: Picks, stepId: StepId): string[] {
  const earlier: string[] = []
  for (const step of STEPS) {
    if (step.id === stepId) break
    earlier.push(...picks[step.id])
  }
  return earlier
}

export function availableOptions(catalog: Catalog, stepId: StepId, picks: Picks): Option[] {
  const earlier = earlierPicks(picks, stepId)
  const sameStep = picks[stepId]
  return catalog.options.filter(option => {
    if (option.stepId !== stepId || option.hidden) return false
    const index = sameStep.indexOf(option.id)
    const before = index === -1 ? sameStep : sameStep.slice(0, index)
    return ![...earlier, ...before].some(pickedId => clashes(catalog, option.id, pickedId))
  })
}

export function prunePicks(catalog: Catalog, picks: Picks): Picks {
  const kept = emptyPicks()
  for (const step of STEPS) {
    for (const id of picks[step.id]) {
      if (availableOptions(catalog, step.id, { ...kept, [step.id]: [...kept[step.id], id] }).some(o => o.id === id)) {
        kept[step.id].push(id)
      }
    }
  }
  return kept
}
