export function backupFileName(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `meal-guide-backup-${date.getFullYear()}-${month}-${day}.json`
}
