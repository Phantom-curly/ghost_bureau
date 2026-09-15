import { useMemo, useState } from 'react'
import { assignAll } from './domain/matching'
import { validateData } from './domain/validate'
import type { Ghost, Place } from './domain/types'
import { ghosts as seedGhosts } from './data/ghosts'
import { places } from './data/places'
import { Banner } from './components/Banner'
import { Tabs, type TabId } from './components/Tabs'
import { ApplicationsTab } from './components/ApplicationsTab'
import { PlacesTab } from './components/PlacesTab'
import { ReportTab } from './components/ReportTab'
import { WorklogTab } from './components/WorklogTab'
import './App.css'

function buildEffectiveAssignments(
  ghosts: Ghost[],
  places: Place[],
  overrides: Record<string, string>,
  autoPlaceByGhostId: Map<string, Place>,
): Array<{ ghost: Ghost; place: Place }> {
  const result: Array<{ ghost: Ghost; place: Place }> = []
  for (const ghost of ghosts) {
    const overriddenPlaceId = overrides[ghost.id]
    const place = overriddenPlaceId
      ? places.find((p) => p.id === overriddenPlaceId)
      : autoPlaceByGhostId.get(ghost.id)
    if (place) {
      result.push({ ghost, place })
    }
  }
  return result
}

function App() {
  const [ghosts, setGhosts] = useState<Ghost[]>(seedGhosts)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<TabId>('applications')
  const now = useMemo(() => new Date(), [])

  const validation = useMemo(() => validateData(ghosts, places), [ghosts])

  const auto = useMemo(() => assignAll(ghosts, places, now), [ghosts, now])

  const effectiveAssignments = useMemo(() => {
    const autoPlaceByGhostId = new Map(auto.assignments.map((a) => [a.ghost.id, a.place]))
    return buildEffectiveAssignments(ghosts, places, overrides, autoPlaceByGhostId)
  }, [ghosts, overrides, auto])

  function handleClear() {
    setGhosts([])
  }

  function handleReset() {
    setGhosts(seedGhosts)
    setOverrides({})
  }

  function handleOverride(ghostId: string, placeId: string | null) {
    setOverrides((prev) => {
      if (placeId === null) {
        return Object.fromEntries(Object.entries(prev).filter(([id]) => id !== ghostId))
      }
      return { ...prev, [ghostId]: placeId }
    })
  }

  if (!validation.valid) {
    return (
      <div className="app">
        <h1>Бюро переселения привидений</h1>
        <div className="error-message">
          <p>Данные повреждены, работа приложения приостановлена:</p>
          <ul>
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <h1>Бюро переселения привидений</h1>
      <Banner />
      <Tabs active={activeTab} onChange={setActiveTab} />
      {activeTab === 'applications' && (
        <ApplicationsTab
          ghosts={ghosts}
          places={places}
          effectiveAssignments={effectiveAssignments}
          overrides={overrides}
          onOverride={handleOverride}
          onClear={handleClear}
          onReset={handleReset}
          now={now}
        />
      )}
      {activeTab === 'places' && (
        <PlacesTab places={places} effectiveAssignments={effectiveAssignments} />
      )}
      {activeTab === 'report' && (
        <ReportTab
          ghosts={ghosts}
          places={places}
          effectiveAssignments={effectiveAssignments}
          now={now}
        />
      )}
      {activeTab === 'worklog' && <WorklogTab />}
    </div>
  )
}

export default App
