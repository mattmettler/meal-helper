import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { backupReminder } from '../logic/backupReminder'
import { db } from '../storage/instance'
import { deleteSavedMeal, listSavedMeals, saveMeal, setFavorite } from '../storage/savedMeals'
import { getLastBackupAt } from '../storage/settings'
import { Build } from './screens/Build'
import type { ReminderState } from './screens/BackupReminder'
import { Saved } from './screens/Saved'
import { SavedDetail } from './screens/SavedDetail'
import { TabBar, type Tab } from './TabBar'
import { useCatalog } from './useCatalog'

export function App() {
  const [tab, setTab] = useState<Tab>('build')
  const [openMealId, setOpenMealId] = useState<string | null>(null)
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
          <h1>Your options</h1>
        </section>
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
