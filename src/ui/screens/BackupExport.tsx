import { useState } from 'react'
import type { BackupSummary } from '../../storage/backup'
import { backupAge } from '../backupAge'
import { BackupCounts } from './BackupCounts'

interface BackupExportProps {
  summary: BackupSummary
  lastBackupAt: number | null
  fileName: string
  onSave: () => Promise<void>
  onBack: () => void
}

export function BackupExport({ summary, lastBackupAt, fileName, onSave, onBack }: BackupExportProps) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function save() {
    setPending(true)
    setFailed(false)
    try {
      await onSave()
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="step-sauces">
      <div className="top">
        <h1>Back up your data</h1>
        <button className="back" onClick={onBack}>&lsaquo; Options</button>
      </div>
      <div className="bubble">
        <h2>Save a backup</h2>
        <p>{backupAge(lastBackupAt)}</p>
      </div>
      <BackupCounts summary={summary} />
      <p className="hint">Built-in options come with the app, so they aren't in the file.</p>
      <div className="filepill">{fileName}</div>
      <p className="hint">Your phone will ask where to save it. Keep a copy somewhere outside this app, like Files or cloud storage.</p>
      {failed && <p className="error" role="alert">Couldn't save the backup. Try again?</p>}
      <div className="footer">
        <button className="btn" disabled={pending} onClick={save}>Save backup file</button>
      </div>
    </div>
  )
}
