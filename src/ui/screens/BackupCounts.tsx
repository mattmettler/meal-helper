import type { BackupSummary } from '../../storage/backup'

export function BackupCounts({ summary }: { summary: BackupSummary }) {
  const rows: Array<[string, number]> = [
    ['Custom options', summary.customOptions],
    ['Your tips', summary.tips],
    ['Clashes you set', summary.clashes],
    ['Hidden options', summary.hiddenOptions],
    ['Saved meals', summary.savedMeals],
  ]
  return (
    <div className="card">
      {rows.map(([label, count]) => (
        <div key={label} className="stat"><span>{label}</span><b>{count}</b></div>
      ))}
    </div>
  )
}
