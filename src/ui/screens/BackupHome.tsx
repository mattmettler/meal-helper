interface BackupHomeProps {
  onExport: () => void
  onImport: () => void
  onBack: () => void
}

export function BackupHome({ onExport, onImport, onBack }: BackupHomeProps) {
  return (
    <>
      <div className="top">
        <h1>Backup</h1>
        <button className="back" onClick={onBack}>&lsaquo; Options</button>
      </div>
      <button className="linkrow" onClick={onExport}>
        Save a backup<span className="go" aria-hidden="true">&rsaquo;</span>
      </button>
      <button className="linkrow" onClick={onImport}>
        Restore from a backup<span className="go" aria-hidden="true">&rsaquo;</span>
      </button>
    </>
  )
}
