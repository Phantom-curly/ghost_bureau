import { rankCandidates, tallyOccupancy } from '../domain/matching'
import type { Ghost, Place } from '../domain/types'
import { GhostRow } from './GhostRow'

type ApplicationsTabProps = {
  ghosts: Ghost[]
  places: Place[]
  effectiveAssignments: Array<{ ghost: Ghost; place: Place }>
  overrides: Record<string, string>
  onOverride: (ghostId: string, placeId: string | null) => void
  now: Date
}

export function ApplicationsTab({
  ghosts,
  places,
  effectiveAssignments,
  overrides,
  onOverride,
  now,
}: ApplicationsTabProps) {
  if (ghosts.length === 0) {
    return <p className="empty-state">Заявок нет. Нажмите «Сбросить», чтобы вернуть список.</p>
  }

  const sortedGhosts = [...ghosts].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  )

  return (
    <ul className="ghost-list">
      {sortedGhosts.map((ghost) => {
        const occupancyExcludingSelf = tallyOccupancy(
          places,
          effectiveAssignments.filter((a) => a.ghost.id !== ghost.id),
        )
        const candidates = rankCandidates(ghost, places, occupancyExcludingSelf, now)
        const effectivePlace = effectiveAssignments.find((a) => a.ghost.id === ghost.id)?.place

        return (
          <GhostRow
            key={ghost.id}
            ghost={ghost}
            places={places}
            candidates={candidates}
            effectivePlaceId={effectivePlace?.id}
            isOverridden={ghost.id in overrides}
            onOverride={(placeId) => onOverride(ghost.id, placeId)}
          />
        )
      })}
    </ul>
  )
}
