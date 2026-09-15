import type { Candidate, Evaluation } from '../domain/matching'
import { deadlineStatus, globalViolations, SCORE_WEIGHTS } from '../domain/matching'
import type { Ghost, Place } from '../domain/types'
import { CONDITION_LABELS, CONDITION_VIOLATION_REASON } from '../data/labels'

type GhostRowProps = {
  ghost: Ghost
  candidates: Candidate[]
  effectivePlaceId: string | undefined
  isOverridden: boolean
  onOverride: (placeId: string | null) => void
  now: Date
}

function pluralizeDays(n: number): string {
  const abs = Math.abs(n)
  const mod100 = abs % 100
  const mod10 = abs % 10
  if (mod100 >= 11 && mod100 <= 14) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
}

function formatContribution(n: number): string {
  return n.toFixed(1).replace('.', ',')
}

function AnxietyBar({ anxiety }: { anxiety: number }) {
  return (
    <span className="anxiety-bar" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className={index < anxiety ? 'segment segment-filled' : 'segment'} />
      ))}
    </span>
  )
}

function DeadlineLine({ ghost, now }: { ghost: Ghost; now: Date }) {
  const { daysLeft, state } = deadlineStatus(ghost, now)
  const text =
    state === 'expired'
      ? `просрочен на ${Math.abs(daysLeft)} ${pluralizeDays(daysLeft)}`
      : `осталось ${daysLeft} ${pluralizeDays(daysLeft)}`
  const stateClass =
    state === 'expired' ? 'deadline-expired' : state === 'urgent' ? 'deadline-urgent' : ''

  return (
    <span className={stateClass || undefined}>
      {ghost.deadline} ({text})
    </span>
  )
}

function ConditionTags({ ghost, violations }: { ghost: Ghost; violations: string[] | null }) {
  if (ghost.conditions.length === 0) return null
  return (
    <div className="condition-tags">
      {ghost.conditions.map((condition) => {
        const reason = CONDITION_VIOLATION_REASON[condition]
        const isViolated = violations !== null && reason !== undefined && violations.includes(reason)
        return (
          <span key={condition} className={isViolated ? 'tag tag-violated' : 'tag'}>
            {CONDITION_LABELS[condition]}
          </span>
        )
      })}
    </div>
  )
}

function CandidateLine({ candidate }: { candidate: Candidate }) {
  const { place, evaluation } = candidate
  if (evaluation.eligible) {
    return (
      <li>
        {place.name} — {evaluation.score} из 100
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

type EligibleEvaluation = Extract<Evaluation, { eligible: true }>

function ScoreBreakdownTable({
  ghost,
  place,
  evaluation,
}: {
  ghost: Ghost
  place: Place
  evaluation: EligibleEvaluation
}) {
  const { breakdown, score } = evaluation
  const tempContribution = breakdown.tempScore * SCORE_WEIGHTS.temp
  const noiseContribution = breakdown.noiseScore * SCORE_WEIGHTS.noise
  const humidityContribution = breakdown.humidityScore * SCORE_WEIGHTS.humidity

  return (
    <table className="score-breakdown">
      <caption>
        Почему «{place.name}» — {score} из 100
      </caption>
      <tbody>
        <tr>
          <td>Температура</td>
          <td>
            {place.temp} °C при желаемых {ghost.preferredTemp.min}–{ghost.preferredTemp.max} °C
          </td>
          <td>{formatScore(breakdown.tempScore)} из 100</td>
          <td>× {Math.round(SCORE_WEIGHTS.temp * 100)} %</td>
          <td>{formatContribution(tempContribution)}</td>
        </tr>
        <tr>
          <td>Шум</td>
          <td>
            {place.noise} из 10 при тревожности {ghost.anxiety}
          </td>
          <td>{formatScore(breakdown.noiseScore)} из 100</td>
          <td>× {Math.round(SCORE_WEIGHTS.noise * 100)} %</td>
          <td>{formatContribution(noiseContribution)}</td>
        </tr>
        <tr>
          <td>Влажность</td>
          <td>
            {place.humidity} % при желаемых {breakdown.humidityTarget} %
          </td>
          <td>{formatScore(breakdown.humidityScore)} из 100</td>
          <td>× {Math.round(SCORE_WEIGHTS.humidity * 100)} %</td>
          <td>{formatContribution(humidityContribution)}</td>
        </tr>
        {breakdown.penalty !== 0 && (
          <tr>
            <td colSpan={4}>Штраф: {breakdown.warnings.join(', ')}</td>
            <td>{breakdown.penalty}</td>
          </tr>
        )}
        <tr className="score-total">
          <td colSpan={4}>Итого</td>
          <td>{score} из 100</td>
        </tr>
      </tbody>
    </table>
  )
}

function overrideOptionLabel(candidate: Candidate): string {
  if (candidate.evaluation.eligible) {
    return `${candidate.place.name} — ${candidate.evaluation.score} из 100`
  }
  return `${candidate.place.name} — не подходит`
}

function overrideValue(effectivePlaceId: string | undefined, isOverridden: boolean): string {
  if (!isOverridden) return ''
  return effectivePlaceId ?? ''
}

export function GhostRow({
  ghost,
  candidates,
  effectivePlaceId,
  isOverridden,
  onOverride,
  now,
}: GhostRowProps) {
  const globalIssues = globalViolations(ghost, now)
  const current = candidates.find((c) => c.place.id === effectivePlaceId)
  const currentViolations = current
    ? current.evaluation.eligible
      ? []
      : current.evaluation.violations
    : null
  const topCandidates = candidates.slice(0, 3)
  const restCandidates = candidates.slice(3)

  return (
    <li className="ghost-row">
      <div className="ghost-header">
        <h3>{ghost.name}</h3>
      </div>
      <p className="ghost-note">{ghost.note}</p>

      <dl className="ghost-attributes">
        <dt>Тревожность</dt>
        <dd>
          {ghost.anxiety} / 10 <AnxietyBar anxiety={ghost.anxiety} />
        </dd>
        <dt>Комфортная температура</dt>
        <dd>
          {ghost.preferredTemp.min}–{ghost.preferredTemp.max} °C
        </dd>
        <dt>Дедлайн</dt>
        <dd>
          <DeadlineLine ghost={ghost} now={now} />
        </dd>
      </dl>

      <ConditionTags ghost={ghost} violations={currentViolations} />

      <div className="ghost-proposal">
        {isOverridden && current ? (
          <>
            <p>
              Предложено: <strong>{current.place.name}</strong>
              {current.evaluation.eligible && <> — {current.evaluation.score} из 100</>}
              <span className="override-tag"> (назначено вручную)</span>
            </p>
            {current.evaluation.eligible ? (
              <ScoreBreakdownTable ghost={ghost} place={current.place} evaluation={current.evaluation} />
            ) : (
              <p className="warning">Внимание: {current.evaluation.violations.join(', ')}</p>
            )}
          </>
        ) : globalIssues.length > 0 ? (
          <p className="warning">
            {globalIssues.join(', ')} — переселение невозможно ни в одно место.
          </p>
        ) : current ? (
          <>
            <p>
              Предложено: <strong>{current.place.name}</strong>
              {current.evaluation.eligible && <> — {current.evaluation.score} из 100</>}
            </p>
            {current.evaluation.eligible && (
              <ScoreBreakdownTable ghost={ghost} place={current.place} evaluation={current.evaluation} />
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
          {candidates.map((candidate) => (
            <option key={candidate.place.id} value={candidate.place.id}>
              {overrideOptionLabel(candidate)}
            </option>
          ))}
        </select>
      </label>

      {globalIssues.length === 0 && (
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
      )}
    </li>
  )
}
