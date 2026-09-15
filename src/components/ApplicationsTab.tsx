import { rankCandidates, tallyOccupancy } from '../domain/matching'
import type { Ghost, Place } from '../domain/types'
import { GhostRow } from './GhostRow'
import { Toolbar } from './Toolbar'

type ApplicationsTabProps = {
  ghosts: Ghost[]
  places: Place[]
  effectiveAssignments: Array<{ ghost: Ghost; place: Place }>
  overrides: Record<string, string>
  onOverride: (ghostId: string, placeId: string | null) => void
  onClear: () => void
  onReset: () => void
  now: Date
}

export function ApplicationsTab({
  ghosts,
  places,
  effectiveAssignments,
  overrides,
  onOverride,
  onClear,
  onReset,
  now,
}: ApplicationsTabProps) {
  if (ghosts.length === 0) {
    return (
      <>
        <Toolbar onClear={onClear} onReset={onReset} />
        <p className="empty-state">Заявок нет. Нажмите «Сбросить», чтобы вернуть список.</p>
      </>
    )
  }

  const sortedGhosts = [...ghosts].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  )

  return (
    <>
      <Toolbar onClear={onClear} onReset={onReset} />
      <p className="ordering-note">
        Заявки упорядочены по срочности: чем раньше дедлайн, тем раньше очередь на
        распределение — так же, как их обрабатывает алгоритм.
      </p>
      <details className="score-explainer">
        <summary>Как считается балл</summary>
        <p>
          Сначала жёсткие условия исключают часть мест полностью — например, отсутствие чердака
          или просроченный дедлайн. Из оставшихся подходящих мест каждое получает балл от 0 до
          100 за комфорт: температуру, шум и влажность. Побеждает подходящее место с наибольшим
          баллом.
        </p>
      </details>
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
              candidates={candidates}
              effectivePlaceId={effectivePlace?.id}
              isOverridden={ghost.id in overrides}
              onOverride={(placeId) => onOverride(ghost.id, placeId)}
              now={now}
            />
          )
        })}
      </ul>
    </>
  )
}
