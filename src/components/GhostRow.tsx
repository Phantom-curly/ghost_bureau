import type { Candidate } from '../domain/matching'
import type { Ghost, Place } from '../domain/types'

type GhostRowProps = {
  ghost: Ghost
  places: Place[]
  candidates: Candidate[]
  effectivePlaceId: string | undefined
  isOverridden: boolean
  onOverride: (placeId: string | null) => void
}

function CandidateLine({ candidate }: { candidate: Candidate }) {
  const { place, evaluation } = candidate
  if (evaluation.eligible) {
    return (
      <li>
        {place.name} — балл {evaluation.score}
        {evaluation.breakdown.warnings.length > 0 && (
          <span className="warning"> ({evaluation.breakdown.warnings.join(', ')})</span>
        )}
      </li>
    )
  }
  return (
    <li className="ineligible">
      {place.name} — не подходит: {evaluation.violations.join(', ')}
    </li>
  )
}

export function GhostRow({
  ghost,
  places,
  candidates,
  effectivePlaceId,
  isOverridden,
  onOverride,
}: GhostRowProps) {
  const current = candidates.find((c) => c.place.id === effectivePlaceId)
  const topCandidates = candidates.slice(0, 3)
  const restCandidates = candidates.slice(3)

  return (
    <li className="ghost-row">
      <div className="ghost-header">
        <h3>{ghost.name}</h3>
        <span className="ghost-meta">
          дедлайн {ghost.deadline}, тревожность {ghost.anxiety}, предпочитает {ghost.preferredTemp}
          °C
        </span>
      </div>
      <p className="ghost-note">{ghost.note}</p>

      <div className="ghost-proposal">
        {current ? (
          <>
            <p>
              Предложено: <strong>{current.place.name}</strong>
              {current.evaluation.eligible && <> — балл {current.evaluation.score}</>}
              {isOverridden && <span className="override-tag"> (назначено вручную)</span>}
            </p>
            {current.evaluation.eligible ? (
              <p className="breakdown">
                Температура {current.evaluation.breakdown.tempScore}, шум{' '}
                {current.evaluation.breakdown.noiseScore}, влажность{' '}
                {current.evaluation.breakdown.humidityScore}
                {current.evaluation.breakdown.penalty !== 0 &&
                  ` (штраф ${current.evaluation.breakdown.penalty})`}
              </p>
            ) : (
              <p className="warning">Внимание: {current.evaluation.violations.join(', ')}</p>
            )}
            {current.evaluation.eligible && current.evaluation.breakdown.warnings.length > 0 && (
              <p className="warning">Внимание: {current.evaluation.breakdown.warnings.join(', ')}</p>
            )}
          </>
        ) : (
          <p>Не размещено автоматически — подходящего места не нашлось.</p>
        )}
      </div>

      <label className="override-select">
        Переназначить вручную:{' '}
        <select
          value={overrideValue(effectivePlaceId, isOverridden)}
          onChange={(event) => {
            const { value } = event.target
            onOverride(value === '' ? null : value)
          }}
        >
          <option value="">— автоматически —</option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </label>

      <div className="candidates">
        <p className="candidates-heading">Лучшие варианты:</p>
        <ul>
          {topCandidates.map((candidate) => (
            <CandidateLine key={candidate.place.id} candidate={candidate} />
          ))}
        </ul>
        {restCandidates.length > 0 && (
          <>
            <p className="candidates-heading">Остальные места:</p>
            <ul>
              {restCandidates.map((candidate) => (
                <CandidateLine key={candidate.place.id} candidate={candidate} />
              ))}
            </ul>
          </>
        )}
      </div>
    </li>
  )
}

function overrideValue(effectivePlaceId: string | undefined, isOverridden: boolean): string {
  if (!isOverridden) return ''
  return effectivePlaceId ?? ''
}
