import type { CSSProperties } from 'react'
import { STEPS } from '../../logic/steps'
import type { Catalog, StepId } from '../../logic/types'
import { backupAge } from '../backupAge'
import { stepClass } from '../stepTheme'
import { Logo } from '../Logo'
import { BackupReminder, type ReminderState } from './BackupReminder'

interface OptionsProps {
  catalog: Catalog
  onOpenOption: (id: string) => void
  onAdd: (stepId: StepId) => void
  onOpenHidden: () => void
  onExport: () => void
  onImport: () => void
  reminder: ReminderState
}

export function Options({ catalog, onOpenOption, onAdd, onOpenHidden, onExport, onImport, reminder }: OptionsProps) {
  const hiddenCount = catalog.options.filter(o => o.hidden && !o.isCustom).length

  return (
    <>
      <div className="top">
        <Logo />
        <h1>Your options</h1>
      </div>
      <BackupReminder reminder={reminder} />
      {STEPS.map(step => (
        <div key={step.id} className={`optgroup ${stepClass(step.id)}`}>
          <div className="group-label">{step.name}</div>
          <div>
            {catalog.options.filter(o => o.stepId === step.id && !o.hidden).map(option => (
              <button
                key={option.id}
                className={`mini ${option.isCustom ? 'custom' : ''}`}
                onClick={() => onOpenOption(option.id)}
              >
                {option.name}
                {option.isCustom && <>{' '}<span className="visually-hidden">custom</span></>}
              </button>
            ))}
          </div>
          <button className="addrow" onClick={() => onAdd(step.id)}>+ Add an option</button>
        </div>
      ))}
      <button className="linkrow" onClick={onOpenHidden}>
        Hidden options ({hiddenCount})<span className="go" aria-hidden="true">&rsaquo;</span>
      </button>
      <div className="backup">
        <h2>Backup</h2>
        <p>{backupAge(reminder.lastBackupAt)}</p>
        <button className="btn" style={{ '--c': 'var(--sauces)' } as CSSProperties} onClick={onExport}>Save a backup</button>
        <button className="btn ghost" onClick={onImport}>Restore from a backup</button>
      </div>
      <div className="legal">
        <p>Icon image from vecteezy.com</p>
        <p>Made by Matt for kestrel &lt;3</p>
      </div>
    </>
  )
}
