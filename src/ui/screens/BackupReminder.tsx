export interface ReminderState {
  show: boolean
  lastBackupAt: number | null
}

export function BackupReminder({ reminder }: { reminder: ReminderState }) {
  if (!reminder.show) return null
  return (
    <p className="reminder">
      {reminder.lastBackupAt === null ? 'No backup yet' : "It's been a while since your last backup"}
    </p>
  )
}
