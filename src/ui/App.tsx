import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { backupReminder } from '../logic/backupReminder'
import { exportBackup, importBackup, serializeBackup, summarizeBackup, type BackupFile } from '../storage/backup'
import { db } from '../storage/instance'
import { deleteSavedMeal, listSavedMeals, saveMeal, setFavorite } from '../storage/savedMeals'
import { getLastBackupAt, recordBackupExport } from '../storage/settings'
import {
  addCustomOptionWithClashes, addUserTip, deleteCustomOption, deleteUserTip, hideBuiltInOption,
  restoreBuiltInOption, setClashes, updateCustomOptionNote,
} from '../storage/userData'
import { backupFileName } from './backupFileName'
import { downloadFile } from './downloadFile'
import { BackupExport } from './screens/BackupExport'
import { BackupImport } from './screens/BackupImport'
import { Build } from './screens/Build'
import type { ReminderState } from './screens/BackupReminder'
import { Compatibility } from './screens/Compatibility'
import { HiddenOptions } from './screens/HiddenOptions'
import { OptionDetail } from './screens/OptionDetail'
import { OptionAdd } from './screens/OptionAdd'
import { Options } from './screens/Options'
import { Saved } from './screens/Saved'
import { SavedDetail } from './screens/SavedDetail'
import { TabBar, type Tab } from './TabBar'
import type { StepId } from '../logic/types'
import { useCatalog } from './useCatalog'

type OptionsView =
  | { screen: 'home' }
  | { screen: 'add'; stepId: StepId; name?: string; note?: string }
  | { screen: 'compatibility'; input: { stepId: StepId; name: string; note?: string } }
  | { screen: 'detail'; optionId: string }
  | { screen: 'editClashes'; optionId: string }
  | { screen: 'hidden' }
  | { screen: 'backupExport'; fileName: string }
  | { screen: 'backupImport' }

export function App() {
  const [tab, setTab] = useState<Tab>('build')
  const [openMealId, setOpenMealId] = useState<string | null>(null)
  const [optionsView, setOptionsView] = useState<OptionsView>({ screen: 'home' })
  const [buildKey, setBuildKey] = useState(0)
  const catalog = useCatalog()
  const meals = useLiveQuery(() => listSavedMeals(db), [])
  const reminder = useLiveQuery(async (): Promise<ReminderState> => {
    const lastBackupAt = await getLastBackupAt(db)
    const savedMealCount = await db.savedMeals.count()
    return { show: backupReminder({ lastBackupAt, now: Date.now(), savedMealCount }), lastBackupAt }
  }, [])

  if (!catalog || !meals || !reminder) return <p className="loading">Loading...</p>

  const openMeal = meals.find(m => m.id === openMealId)
  const backToOptions = () => setOptionsView({ screen: 'home' })
  const saveBackupFile = async (fileName: string) => {
    const text = serializeBackup(await exportBackup(db))
    downloadFile(new File([text], fileName, { type: 'application/json' }))
    await recordBackupExport(db)
  }
  const countCurrentData = async () => summarizeBackup(await exportBackup(db))
  const replaceAllData = async (file: BackupFile) => {
    await importBackup(db, file)
    setBuildKey(key => key + 1)
  }
  // Build keeps its place; Saved and Options start from their home screen each time you come back.
  const changeTab = (next: Tab) => {
    if (next === tab) return
    if (tab === 'saved') setOpenMealId(null)
    if (tab === 'options') setOptionsView({ screen: 'home' })
    setTab(next)
  }
  const clashEditOption =optionsView.screen === 'editClashes'
    ? catalog.options.find(o => o.id === optionsView.optionId)
    : undefined

  return (
    <div className="app">
      <main className="screen">
        <section className="panel" hidden={tab !== 'build'}>
          <Build key={buildKey} catalog={catalog} onSave={async meal => { await saveMeal(db, meal); setTab('saved') }} />
        </section>
        <section className="panel-scroll" hidden={tab !== 'saved'}>
          {openMeal ? (
            <SavedDetail
              meal={openMeal}
              onDelete={async id => { await deleteSavedMeal(db, id); setOpenMealId(null) }}
              onBack={() => setOpenMealId(null)}
            />
          ) : (
            <Saved
              meals={meals}
              onToggleFavorite={(id, isFavorite) => setFavorite(db, id, isFavorite)}
              onOpen={setOpenMealId}
              reminder={reminder}
            />
          )}
        </section>
        <section className="panel-scroll" hidden={tab !== 'options'}>
          {optionsView.screen === 'add' && (
            <OptionAdd
              initialStepId={optionsView.stepId}
              initialName={optionsView.name}
              initialNote={optionsView.note}
              onNext={input => setOptionsView({ screen: 'compatibility', input })}
              onBack={() => setOptionsView({ screen: 'home' })}
            />
          )}
          {optionsView.screen === 'compatibility' && (
            <Compatibility
              catalog={catalog}
              optionName={optionsView.input.name}
              stepId={optionsView.input.stepId}
              initialChecked={[]}
              onSave={async checkedIds => {
                await addCustomOptionWithClashes(db, optionsView.input, checkedIds)
                setOptionsView({ screen: 'home' })
              }}
              onBack={() => setOptionsView({ screen: 'add', ...optionsView.input })}
            />
          )}
          {optionsView.screen === 'detail' && (
            <OptionDetail
              key={optionsView.optionId}
              catalog={catalog}
              optionId={optionsView.optionId}
              onSaveNote={note => updateCustomOptionNote(db, optionsView.optionId, note)}
              onEditClashes={() => setOptionsView({ screen: 'editClashes', optionId: optionsView.optionId })}
              onAddTip={text => addUserTip(db, optionsView.optionId, text)}
              onDeleteTip={tipId => deleteUserTip(db, tipId)}
              onHide={async () => { await hideBuiltInOption(db, optionsView.optionId); backToOptions() }}
              onDelete={async () => { await deleteCustomOption(db, optionsView.optionId); backToOptions() }}
              onBack={backToOptions}
            />
          )}
          {optionsView.screen === 'editClashes' && clashEditOption && (
            <Compatibility
              catalog={catalog}
              optionName={clashEditOption.name}
              stepId={clashEditOption.stepId}
              initialChecked={catalog.pairs
                .filter(p => p.a === clashEditOption.id || p.b === clashEditOption.id)
                .map(p => (p.a === clashEditOption.id ? p.b : p.a))}
              excludeOptionId={clashEditOption.id}
              onSave={async checkedIds => {
                await setClashes(db, clashEditOption.id, checkedIds)
                setOptionsView({ screen: 'detail', optionId: clashEditOption.id })
              }}
              onBack={() => setOptionsView({ screen: 'detail', optionId: clashEditOption.id })}
            />
          )}
          {optionsView.screen === 'hidden' && (
            <HiddenOptions
              catalog={catalog}
              onRestore={optionId => restoreBuiltInOption(db, optionId)}
              onBack={backToOptions}
            />
          )}
          {optionsView.screen === 'backupExport' && (
            <BackupExport
              loadSummary={countCurrentData}
              lastBackupAt={reminder.lastBackupAt}
              fileName={optionsView.fileName}
              onSave={() => saveBackupFile(optionsView.fileName)}
              onBack={backToOptions}
            />
          )}
          {optionsView.screen === 'backupImport' && (
            <BackupImport
              loadCurrentSummary={countCurrentData}
              onReplace={replaceAllData}
              onBack={backToOptions}
            />
          )}
          {optionsView.screen === 'home' && (
            <Options
              catalog={catalog}
              onOpenOption={optionId => setOptionsView({ screen: 'detail', optionId })}
              onAdd={stepId => setOptionsView({ screen: 'add', stepId })}
              onOpenHidden={() => setOptionsView({ screen: 'hidden' })}
              onExport={() => setOptionsView({ screen: 'backupExport', fileName: backupFileName(new Date()) })}
              onImport={() => setOptionsView({ screen: 'backupImport' })}
              reminder={reminder}
            />
          )}
        </section>
      </main>
      <TabBar tab={tab} onChange={changeTab} />
    </div>
  )
}
