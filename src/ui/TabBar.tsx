export type Tab = 'build' | 'saved' | 'options'

const TABS: Array<{ id: Tab; icon: string; label: string }> = [
  { id: 'build', icon: '🥣', label: 'Build' },
  { id: 'saved', icon: '💛', label: 'Saved' },
  { id: 'options', icon: '🌿', label: 'Options' },
]

interface TabBarProps {
  tab: Tab
  onChange: (tab: Tab) => void
}

export function TabBar({ tab, onChange }: TabBarProps) {
  return (
    <nav className="tabs" aria-label="Main">
      {TABS.map(({ id, icon, label }) => (
        <button
          key={id}
          type="button"
          className={id === tab ? 'tab on' : 'tab'}
          aria-current={id === tab ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <span aria-hidden="true">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  )
}
