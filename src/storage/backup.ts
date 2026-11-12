import type { CustomOptionRow, SavedMeal, StepId, UserPairRow, UserTipRow } from '../logic/types'
import type { HiddenBuiltInRow, MealGuideDb } from './db'

export const BACKUP_APP = 'improvised-meal-guide'
export const BACKUP_FORMAT_VERSION = 1

export interface BackupFile {
  app: string
  formatVersion: number
  exportedAt: number
  data: {
    customOptions: CustomOptionRow[]
    hiddenBuiltIns: HiddenBuiltInRow[]
    userPairs: UserPairRow[]
    userTips: UserTipRow[]
    savedMeals: SavedMeal[]
  }
}

export type ParsedBackup = { ok: true; file: BackupFile } | { ok: false; error: string }

const NOT_A_BACKUP = "That doesn't look like a backup from this app"
const NEWER_VERSION = 'This backup is from a newer version of the app'
const STEP_IDS: StepId[] = ['starch', 'greens', 'protein', 'veggies', 'sauces', 'garnish']

export async function exportBackup(db: MealGuideDb, now = Date.now()): Promise<BackupFile> {
  const [customOptions, hiddenBuiltIns, userPairs, userTips, savedMeals] = await Promise.all([
    db.customOptions.toArray(),
    db.hiddenBuiltIns.toArray(),
    db.userPairs.toArray(),
    db.userTips.toArray(),
    db.savedMeals.toArray(),
  ])
  return {
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now,
    data: { customOptions, hiddenBuiltIns, userPairs, userTips, savedMeals },
  }
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2)
}

type Check = (value: unknown) => boolean

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString: Check = (value) => typeof value === 'string'
const isNumber: Check = (value) => typeof value === 'number' && Number.isFinite(value)
const isStepId: Check = (value) => STEP_IDS.includes(value as StepId)
const optionalString: Check = (value) => value === undefined || isString(value)
const arrayOf = (check: Check): Check => (value) => Array.isArray(value) && value.every(check)

function rowOf(fields: Record<string, Check>): Check {
  return (value) => isRecord(value) && Object.entries(fields).every(([key, check]) => check(value[key]))
}

const isMealItem = rowOf({ optionName: isString, tips: arrayOf(isString) })
const isMealGroup = rowOf({ stepName: isString, items: arrayOf(isMealItem) })

const TABLES: Array<{ name: keyof BackupFile['data']; idField: string; isRow: Check }> = [
  { name: 'customOptions', idField: 'id', isRow: rowOf({ id: isString, stepId: isStepId, name: isString, note: optionalString }) },
  { name: 'hiddenBuiltIns', idField: 'optionId', isRow: rowOf({ optionId: isString }) },
  { name: 'userPairs', idField: 'id', isRow: rowOf({ id: isString, optionIdA: isString, optionIdB: isString }) },
  { name: 'userTips', idField: 'id', isRow: rowOf({ id: isNumber, optionId: isString, text: isString }) },
  {
    name: 'savedMeals',
    idField: 'id',
    isRow: rowOf({
      id: isString,
      name: isString,
      groups: arrayOf(isMealGroup),
      isFavorite: (value) => typeof value === 'boolean',
      createdAt: isNumber,
    }),
  },
]

function hasDuplicateIds(rows: Array<Record<string, unknown>>, idField: string): boolean {
  return new Set(rows.map((row) => row[idField])).size !== rows.length
}

export function parseBackup(text: string): ParsedBackup {
  const invalid: ParsedBackup = { ok: false, error: NOT_A_BACKUP }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return invalid
  }
  if (!isRecord(parsed) || parsed.app !== BACKUP_APP || !isNumber(parsed.formatVersion) || !isNumber(parsed.exportedAt)) {
    return invalid
  }
  if (parsed.formatVersion > BACKUP_FORMAT_VERSION) return { ok: false, error: NEWER_VERSION }
  if (!isRecord(parsed.data)) return invalid
  for (const table of TABLES) {
    const rows = parsed.data[table.name]
    if (!arrayOf(table.isRow)(rows)) return invalid
    if (hasDuplicateIds(rows as Array<Record<string, unknown>>, table.idField)) return invalid
  }
  return { ok: true, file: parsed as unknown as BackupFile }
}

export function summarizeBackup(file: BackupFile) {
  return {
    customOptions: file.data.customOptions.length,
    tips: file.data.userTips.length,
    clashes: file.data.userPairs.length,
    hiddenOptions: file.data.hiddenBuiltIns.length,
    savedMeals: file.data.savedMeals.length,
  }
}

export async function importBackup(db: MealGuideDb, file: BackupFile): Promise<void> {
  const tables = [db.customOptions, db.hiddenBuiltIns, db.userPairs, db.userTips, db.savedMeals]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()))
    await db.customOptions.bulkAdd(file.data.customOptions)
    await db.hiddenBuiltIns.bulkAdd(file.data.hiddenBuiltIns)
    await db.userPairs.bulkAdd(file.data.userPairs)
    await db.userTips.bulkAdd(file.data.userTips)
    await db.savedMeals.bulkAdd(file.data.savedMeals)
  })
}
