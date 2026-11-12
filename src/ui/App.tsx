import { useState } from 'react'
import { db } from '../storage/instance'
import { saveMeal } from '../storage/savedMeals'
import { Build } from './screens/Build'
import { TabBar, type Tab } from './TabBar'
import { useCatalog } from './useCatalog'

export function App() {
  const [tab, setTab] = useState<Tab>('build')
  const catalog = useCatalog()

  if (!catalog) return <p className="loading">Loading...</p>

  return (
    <div className="app">
      <main className="screen">
        <section hidden={tab !== 'build'}>
          <Build catalog={catalog} onSave={meal => { void saveMeal(db, meal).then(() => setTab('saved')) }} />
        </section>
        <section hidden={tab !== 'saved'}>
          <h1>Saved meals</h1>
        </section>
        <section hidden={tab !== 'options'}>
          <h1>Your options</h1>
        </section>
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  )
}
