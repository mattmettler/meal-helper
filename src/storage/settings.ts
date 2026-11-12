import type { MealGuideDb } from './db'

const LAST_BACKUP_KEY = 'lastBackupAt'

export async function getLastBackupAt(db: MealGuideDb): Promise<number | null> {
  const row = await db.settings.get(LAST_BACKUP_KEY)
  return typeof row?.value === 'number' ? row.value : null
}

export async function recordBackupExport(db: MealGuideDb, now = Date.now()): Promise<void> {
  await db.settings.put({ key: LAST_BACKUP_KEY, value: now })
}
