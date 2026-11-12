const BACKUP_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000

export function backupReminder(input: {
  lastBackupAt: number | null
  now: number
  savedMealCount: number
}): boolean {
  if (input.lastBackupAt === null) return input.savedMealCount > 0
  return input.now - input.lastBackupAt > BACKUP_INTERVAL_MS
}
