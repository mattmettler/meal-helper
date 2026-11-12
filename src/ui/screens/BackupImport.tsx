import { useState, type ChangeEvent } from 'react'
import {
  NEWER_VERSION, parseBackup, summarizeBackup, type BackupFile, type BackupSummary,
} from '../../storage/backup'
import { plural } from '../plural'
import { readFileText } from '../readFileText'
import { Logo } from '../Logo'
import { BackupCounts } from './BackupCounts'

interface BackupImportProps {
  loadCurrentSummary: () => Promise<BackupSummary>
  onReplace: (file: BackupFile) => Promise<void>
  onBack: () => void
}

type Stage =
  | { kind: 'choose' }
  | { kind: 'bad'; message: string }
  | { kind: 'confirm'; file: BackupFile; fileName: string; current: BackupSummary | 'loading' | 'failed' }
  | { kind: 'done'; summary: BackupSummary }

const NOT_ONE_OF_MINE = "Hmm, that doesn't look like one of my backups."

export function BackupImport({ loadCurrentSummary, onReplace, onBack }: BackupImportProps) {
  const [stage, setStage] = useState<Stage>({ kind: 'choose' })
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    if (!picked) return
    let text: string
    try {
      text = await readFileText(picked)
    } catch {
      setStage({ kind: 'bad', message: NOT_ONE_OF_MINE })
      return
    }
    const parsed = parseBackup(text)
    if (parsed.ok) {
      const confirm = { kind: 'confirm', file: parsed.file, fileName: picked.name } as const
      setStage({ ...confirm, current: 'loading' })
      let current: BackupSummary | 'failed'
      try {
        current = await loadCurrentSummary()
      } catch {
        current = 'failed'
      }
      // Ignore the result if the user has already cancelled or picked another file.
      setStage(latest => (latest.kind === 'confirm' && latest.file === parsed.file ? { ...confirm, current } : latest))
    } else {
      setStage({ kind: 'bad', message: parsed.error === NEWER_VERSION ? parsed.error : NOT_ONE_OF_MINE })
    }
  }

  async function replace(file: BackupFile) {
    setPending(true)
    setFailed(false)
    try {
      await onReplace(file)
      setStage({ kind: 'done', summary: summarizeBackup(file) })
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  function chooseAgain() {
    setFailed(false)
    setStage({ kind: 'choose' })
  }

  if (stage.kind === 'bad') {
    return (
      <div className="step-protein">
        <div className="center">
          <Logo large />
          <h2>{stage.message}</h2>
          <p>Nothing was changed. Try picking a different file.</p>
          <button className="btn" onClick={chooseAgain}>Choose another file</button>
        </div>
      </div>
    )
  }

  if (stage.kind === 'done') {
    const { customOptions, tips, savedMeals } = stage.summary
    return (
      <div className="step-greens">
        <div className="center">
          <Logo large />
          <h2>All restored!</h2>
          <p>{plural(customOptions, 'custom option')}, {plural(tips, 'tip')}, and {plural(savedMeals, 'saved meal')} are back.</p>
          <button className="btn" onClick={onBack}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="step-protein">
      <div className="top">
        <Logo />
        <h1>Restore from backup</h1>
        <button className="back" onClick={onBack}>&lsaquo; Options</button>
      </div>
      {stage.kind === 'choose' ? (
        <>
          <label className="small" htmlFor="backup-file">Choose a backup file</label>
          <input id="backup-file" className="field" type="file" accept="application/json,.json" onChange={choose} />
        </>
      ) : (
        <>
          <div className="filepill">{stage.fileName}</div>
          <div className="sect">This backup has</div>
          <BackupCounts summary={summarizeBackup(stage.file)} />
          {stage.current === 'loading' && <p className="hint">Counting your data...</p>}
          {stage.current === 'failed' && <p className="error" role="alert">Couldn't read your data. Try again?</p>}
          {typeof stage.current === 'object' && (
            <div className="warn">
              <b>This replaces what's on this phone now:</b> {plural(stage.current.customOptions, 'custom option')},{' '}
              {plural(stage.current.tips, 'tip')}, and {plural(stage.current.savedMeals, 'saved meal')}. It can't be undone.
            </div>
          )}
          {failed && <p className="error" role="alert">Couldn't restore that. Nothing was changed. Try again?</p>}
          <div className="footer">
            {stage.current !== 'failed' && (
              <button className="btn danger" disabled={pending || stage.current === 'loading'} onClick={() => replace(stage.file)}>Replace my data</button>
            )}
            <button className="btn ghost" disabled={pending} onClick={chooseAgain}>Cancel</button>
          </div>
        </>
      )}
    </div>
  )
}
