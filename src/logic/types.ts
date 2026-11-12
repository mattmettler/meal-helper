export type StepId = 'starch' | 'greens' | 'protein' | 'veggies' | 'sauces' | 'garnish'
export interface Step { id: StepId; name: string; multi: boolean }
export interface Option { id: string; stepId: StepId; name: string; note?: string; isCustom: boolean; hidden: boolean }
export interface Pair { a: string; b: string }
export interface Tip { id: string; optionId: string; text: string; isCustom: boolean }
export interface Catalog { options: Option[]; pairs: Pair[]; tips: Tip[] }
export type Picks = Record<StepId, string[]>          // option ids in pick order
export interface MealItem { optionName: string; tips: string[] }
export interface MealGroup { stepName: string; items: MealItem[] }
export interface Meal { name: string; groups: MealGroup[] }
export interface SavedMeal extends Meal { id: string; isFavorite: boolean; createdAt: number }
export interface Seed {
  options: Array<{ id: string; stepId: StepId; name: string; note?: string }>
  pairs: Pair[]
  tips: Array<{ id: string; optionId: string; text: string }>   // built-in tips keep their array order
}
export interface CustomOptionRow { id: string; stepId: StepId; name: string; note?: string }
export interface UserPairRow { id: string; optionIdA: string; optionIdB: string }
export interface UserTipRow { id: number; optionId: string; text: string }   // id auto-increments, so rows come back in the order added
export interface UserData {
  customOptions: CustomOptionRow[]; hiddenBuiltIns: string[]
  userPairs: UserPairRow[]; userTips: UserTipRow[]
}
