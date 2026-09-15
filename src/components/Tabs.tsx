export type TabId = 'applications' | 'places' | 'report' | 'worklog'

const TAB_LABELS: Record<TabId, string> = {
  applications: 'Заявки',
  places: 'Места',
  report: 'Отчёт',
  worklog: 'AI Worklog',
}

const TAB_ORDER: TabId[] = ['applications', 'places', 'report', 'worklog']

type TabsProps = {
  active: TabId
  onChange: (tab: TabId) => void
}

export function Tabs({ active, onChange }: TabsProps) {
  return (
    <nav className="tabs">
      {TAB_ORDER.map((tab) => (
        <button
          key={tab}
          type="button"
          className={tab === active ? 'tab tab-active' : 'tab'}
          onClick={() => onChange(tab)}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </nav>
  )
}
