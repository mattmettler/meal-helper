import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { backupReminder } from '../logic/backupReminder'
import { db } from '../storage/instance'
import { deleteSavedMeal, listSavedMeals, saveMeal, setFavorite } from '../storage/savedMeals'
import { getLastBackupAt } from '../storage/settings'
import { addCustomOptionWithClashes } from '../storage/userData'
import { Build } from './screens/Build'
import type { ReminderState } from './screens/BackupReminder'
import { Compatibility } from './screens/Compatibility'
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

export function App() {
  const [tab, setTab] = useState<Tab>('build')
  const [openMealId, setOpenMealId] = useState<string | null>(null)
  const [optionsView, setOptionsView] = useState<OptionsView>({ screen: 'home' })
  const catalog = useCatalog()
  const meals = useLiveQuery(() => listSavedMeals(db), [])
  const reminder = useLiveQuery(async (): Promise<ReminderState> => {
    const lastBackupAt = await getLastBackupAt(db)
    const savedMealCount = await db.savedMeals.count()
    return { show: backupReminder({ lastBackupAt, now: Date.now(), savedMealCount }), lastBackupAt }
  }, [])

  if (!catalog || !meals || !reminder) return <p className="loading">Loading...</p>

  const openMeal = meals.find(m => m.id === openMealId)

  return (
    <div className="app">
      <main className="screen">
        <section hidden={tab !== 'build'}>
          <Build catalog={catalog} onSave={async meal => { await saveMeal(db, meal); setTab('saved') }} />
        </section>
        <section hidden={tab !== 'saved'}>
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
        <section hidden={tab !== 'options'}>
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
          {optionsView.screen === 'home' && (
            <Options
              catalog={catalog}
              onOpenOption={() => {}}
              onAdd={stepId => setOptionsView({ screen: 'add', stepId })}
              onOpenHidden={() => {}}
              onOpenBackup={() => {}}
              reminder={reminder}
            />
          )}
        </section>
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
