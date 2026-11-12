import type { StepId } from '../logic/types'

export function stepClass(stepId: StepId): string {
  return `step-${stepId}`
}
