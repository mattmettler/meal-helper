import { useState } from 'react'
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
          <h1>Build a meal</h1>
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
