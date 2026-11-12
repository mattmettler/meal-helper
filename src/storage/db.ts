import Dexie, { type Table } from 'dexie'
import type { SavedMeal, CustomOptionRow, UserPairRow, UserTipRow } from '../logic/types'

export interface HiddenBuiltInRow { optionId: string }
export interface SettingRow { key: string; value: unknown }

export class MealGuideDb extends Dexie {
  customOptions!: Table<CustomOptionRow, string>
  hiddenBuiltIns!: Table<HiddenBuiltInRow, string>
  userPairs!: Table<UserPairRow, string>
  userTips!: Table<UserTipRow, number, Omit<UserTipRow, 'id'>>
  savedMeals!: Table<SavedMeal, string>
  settings!: Table<SettingRow, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      customOptions: 'id, stepId',
      hiddenBuiltIns: 'optionId',
      userPairs: 'id, optionIdA, optionIdB',
      userTips: '++id, optionId',
      savedMeals: 'id, createdAt',
      settings: 'key',
    })
  }
}

export function createDb(name = 'meal-guide'): MealGuideDb {
  return new MealGuideDb(name)
}
