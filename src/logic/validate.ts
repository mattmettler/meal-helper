import type { Picks, StepId } from './types'

const SUBSTANTIAL_STEPS: StepId[] = ['starch', 'greens', 'protein']

export function validateMeal(picks: Picks): 'ok' | 'too-thin' {
  const hasSubstantialPick = SUBSTANTIAL_STEPS.some((id) => picks[id].length > 0)
  const stepsPicked = Object.values(picks).filter((ids) => ids.length > 0).length
  return hasSubstantialPick && stepsPicked >= 2 ? 'ok' : 'too-thin'
}
