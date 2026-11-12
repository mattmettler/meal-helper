const DAY_MS = 24 * 60 * 60 * 1000

export function backupAge(lastBackupAt: number | null): string {
  if (lastBackupAt === null) return 'Never backed up'
  const days = Math.floor((Date.now() - lastBackupAt) / DAY_MS)
  if (days <= 0) return 'Last backed up today'
  return `Last backed up ${days} ${days === 1 ? 'day' : 'days'} ago`
}
