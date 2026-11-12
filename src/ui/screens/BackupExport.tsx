import { useEffect, useState } from 'react'
import type { BackupSummary } from '../../storage/backup'
import { backupAge } from '../backupAge'
import { Logo } from '../Logo'
import { BackupCounts } from './BackupCounts'

interface BackupExportProps {
  loadSummary: () => Promise<BackupSummary>
  lastBackupAt: number | null
  fileName: string
  onSave: () => Promise<void>
  onBack: () => void
}

export function BackupExport({ loadSummary, lastBackupAt, fileName, onSave, onBack }: BackupExportProps) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [countFailed, setCountFailed] = useState(false)
  const [countAttempt, setCountAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadSummary().then(
      loaded => { if (!cancelled) setSummary(loaded) },
      () => { if (!cancelled) setCountFailed(true) },
    )
    return () => { cancelled = true }
    // loadSummary is deliberately not a dependency: the counts are read once per open (or retry)
  }, [countAttempt])

  function countAgain() {
    setCountFailed(false)
    setCountAttempt(attempt => attempt + 1)
  }

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
        <Logo />
        <h1>Back up your data</h1>
        <button className="back" onClick={onBack}>&lsaquo; Options</button>
      </div>
      <div className="bubble">
        <h2>Save a backup</h2>
        <p>{backupAge(lastBackupAt)}</p>
      </div>
      {summary && <BackupCounts summary={summary} />}
      {!summary && !countFailed && <p className="hint">Counting your data...</p>}
      {countFailed && (
        <>
          <p className="error" role="alert">Couldn't read your data. Try again?</p>
          <button className="btn ghost" onClick={countAgain}>Try again</button>
        </>
      )}
      <p className="hint">Built-in options come with the app, so they aren't in the file.</p>
      <div className="filepill">{fileName}</div>
      <p className="hint">Your phone will ask where to save it. Keep a copy somewhere outside this app, like Files or cloud storage.</p>
      {failed && <p className="error" role="alert">Couldn't save the backup. Try again?</p>}
      <div className="footer">
        <button className="btn" disabled={pending || !summary} onClick={save}>Save backup file</button>
      </div>
    </div>
  )
}
