import type { Condition, Ghost, Place } from './types'

export type Breakdown = {
  tempScore: number
  noiseScore: number
  humidityScore: number
  humidityTarget: number
  penalty: number
  warnings: string[]
}

export type Evaluation =
  | { eligible: true; violations: string[]; score: number; breakdown: Breakdown }
  | { eligible: false; violations: string[]; score: null; breakdown: null }

export type Assignment = { ghost: Ghost; place: Place; score: number; breakdown: Breakdown }

export type AssignAllResult = { assignments: Assignment[]; unplaced: Ghost[] }

export type Candidate = { place: Place; evaluation: Evaluation }

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function hasCondition(ghost: Ghost, condition: Condition): boolean {
  return ghost.conditions.includes(condition)
}

export type Violation = string

function checkDeadlineExpired(ghost: Ghost, now: Date): boolean {
  return new Date(ghost.deadline) < now
}

// Violations that don't depend on any place — today, just the deadline. `evaluate` calls this
// rather than checking the deadline itself, so there is exactly one place this rule lives.
export function globalViolations(ghost: Ghost, now: Date): Violation[] {
  if (checkDeadlineExpired(ghost, now)) {
    return ['Дедлайн переселения просрочен']
  }
  return []
}

function checkCapacity(_ghost: Ghost, place: Place, occupancy: number): boolean {
  return occupancy >= place.capacity
}

function checkHumans(ghost: Ghost, place: Place): boolean {
  return hasCondition(ghost, 'no_humans') && place.hasHumans
}

function checkAttic(ghost: Ghost, place: Place): boolean {
  return hasCondition(ghost, 'attic') && !place.hasAttic
}

function checkMirrors(ghost: Ghost, place: Place): boolean {
  return hasCondition(ghost, 'no_mirrors') && place.hasMirrors
}

function checkLight(ghost: Ghost, place: Place): boolean {
  return hasCondition(ghost, 'needs_dark') && place.light > 6
}

const PLACE_CHECKS: Array<{
  check: (ghost: Ghost, place: Place, occupancy: number) => boolean
  reason: string
}> = [
  { check: checkCapacity, reason: 'Нет свободных мест' },
  { check: checkHumans, reason: 'В здании живут люди' },
  { check: checkAttic, reason: 'В здании нет чердака' },
  { check: checkMirrors, reason: 'В здании есть зеркала' },
  { check: checkLight, reason: 'Слишком светло' },
]

function findPlaceViolations(ghost: Ghost, place: Place, occupancy: number): Violation[] {
  return PLACE_CHECKS.filter(({ check }) => check(ghost, place, occupancy)).map(
    ({ reason }) => reason,
  )
}

function tempDistance(ghost: Ghost, place: Place): number {
  const { min, max } = ghost.preferredTemp
  if (place.temp < min) return min - place.temp
  if (place.temp > max) return place.temp - max
  return 0
}

export const SCORE_WEIGHTS = { temp: 0.3, noise: 0.4, humidity: 0.3 } as const

function scorePlace(ghost: Ghost, place: Place): { score: number; breakdown: Breakdown } {
  const tempScore = clamp(100 - tempDistance(ghost, place) * 8, 0, 100)
  const noiseScore = clamp(100 - place.noise * ghost.anxiety, 0, 100)
  const humidityTarget = hasCondition(ghost, 'likes_damp') ? 80 : 45
  const humidityScore = clamp(100 - Math.abs(place.humidity - humidityTarget) * 1.5, 0, 100)
  const rawScore = Math.round(
    tempScore * SCORE_WEIGHTS.temp +
      noiseScore * SCORE_WEIGHTS.noise +
      humidityScore * SCORE_WEIGHTS.humidity,
  )

  const warnings: string[] = []
  let penalty = 0
  if (hasCondition(ghost, 'needs_quiet') && place.noise > 5) {
    penalty = -25
    warnings.push('Шумно для этого привидения')
  }

  const score = clamp(rawScore + penalty, 0, 100)
  return {
    score,
    breakdown: { tempScore, noiseScore, humidityScore, humidityTarget, penalty, warnings },
  }
}

export function evaluate(ghost: Ghost, place: Place, occupancy: number, now: Date): Evaluation {
  const violations = [...globalViolations(ghost, now), ...findPlaceViolations(ghost, place, occupancy)]
  if (violations.length > 0) {
    return { eligible: false, violations, score: null, breakdown: null }
  }

  const { score, breakdown } = scorePlace(ghost, place)
  return { eligible: true, violations: [], score, breakdown }
}

function sortByDeadlineThenAnxiety(ghosts: Ghost[]): Ghost[] {
  return [...ghosts].sort((a, b) => {
    const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    if (deadlineDiff !== 0) return deadlineDiff
    return b.anxiety - a.anxiety
  })
}

export function tallyOccupancy(
  places: Place[],
  assignments: Array<{ ghost: Ghost; place: Place }>,
): Record<string, number> {
  const tally: Record<string, number> = Object.fromEntries(places.map((p) => [p.id, 0]))
  for (const { place } of assignments) {
    tally[place.id] += 1
  }
  return tally
}

function compareCandidates(a: Candidate, b: Candidate): number {
  if (a.evaluation.eligible && b.evaluation.eligible) {
    const scoreDiff = b.evaluation.score - a.evaluation.score
    if (scoreDiff !== 0) return scoreDiff
    // Exact overall-score tie: prefer the place that's better on the most
    // heavily-weighted comfort component (noise, x0.4, vs x0.3 for temp and
    // humidity) rather than falling through to incidental array order.
    return b.evaluation.breakdown.noiseScore - a.evaluation.breakdown.noiseScore
  }
  if (a.evaluation.eligible) return -1
  if (b.evaluation.eligible) return 1
  return 0
}

export function rankCandidates(
  ghost: Ghost,
  places: Place[],
  occupancy: Record<string, number>,
  now: Date,
): Candidate[] {
  const evaluated = places.map((place) => ({
    place,
    evaluation: evaluate(ghost, place, occupancy[place.id], now),
  }))
  return [...evaluated].sort(compareCandidates)
}

export function assignAll(ghosts: Ghost[], places: Place[], now: Date): AssignAllResult {
  const occupancy = tallyOccupancy(places, [])
  const assignments: Assignment[] = []
  const unplaced: Ghost[] = []

  for (const ghost of sortByDeadlineThenAnxiety(ghosts)) {
    const [best] = rankCandidates(ghost, places, occupancy, now)
    if (!best || !best.evaluation.eligible) {
      unplaced.push(ghost)
      continue
    }

    occupancy[best.place.id] += 1
    assignments.push({
      ghost,
      place: best.place,
      score: best.evaluation.score,
      breakdown: best.evaluation.breakdown,
    })
  }

  return { assignments, unplaced }
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const URGENT_THRESHOLD_DAYS = 7

export type DeadlineState = 'expired' | 'urgent' | 'normal'
export type DeadlineStatus = { daysLeft: number; state: DeadlineState }

export function deadlineStatus(ghost: Ghost, now: Date): DeadlineStatus {
  const daysLeft = Math.ceil((new Date(ghost.deadline).getTime() - now.getTime()) / MS_PER_DAY)
  const state: DeadlineState =
    daysLeft < 0 ? 'expired' : daysLeft <= URGENT_THRESHOLD_DAYS ? 'urgent' : 'normal'
  return { daysLeft, state }
}

export function occupantsByPlace(
  places: Place[],
  assignments: Array<{ ghost: Ghost; place: Place }>,
): Map<string, Ghost[]> {
  const map = new Map<string, Ghost[]>(places.map((place) => [place.id, []]))
  for (const { ghost, place } of assignments) {
    map.get(place.id)?.push(ghost)
  }
  return map
}
