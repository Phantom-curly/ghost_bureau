import { describe, expect, it } from 'vitest'
import { assignAll, evaluate, rankCandidates, tallyOccupancy } from './matching'
import { ghosts as seedGhosts } from '../data/ghosts'
import { places as seedPlaces } from '../data/places'
import type { Ghost, Place } from './types'

const NOW = new Date('2025-06-01T00:00:00Z')

function makeGhost(overrides: Partial<Ghost> = {}): Ghost {
  return {
    id: 'test-ghost',
    name: 'Тестовый призрак',
    anxiety: 5,
    preferredTemp: 10,
    deadline: '2030-01-01',
    conditions: [],
    note: '',
    ...overrides,
  }
}

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: 'test-place',
    name: 'Тестовое место',
    capacity: 5,
    light: 5,
    noise: 5,
    humidity: 50,
    temp: 10,
    hasHumans: false,
    hasAttic: false,
    hasMirrors: false,
    restriction: null,
    ...overrides,
  }
}

describe('evaluate — hard constraints', () => {
  it('blocks when occupancy has reached capacity', () => {
    const result = evaluate(makeGhost(), makePlace({ capacity: 2 }), 2, NOW)
    expect(result.eligible).toBe(false)
    expect(result.violations).toContain('Нет свободных мест')
  })

  it('does not block when occupancy is below capacity', () => {
    const result = evaluate(makeGhost(), makePlace({ capacity: 2 }), 1, NOW)
    expect(result.violations).not.toContain('Нет свободных мест')
  })

  it('blocks when the deadline has already passed', () => {
    const ghost = makeGhost({ deadline: '2020-01-01' })
    const result = evaluate(ghost, makePlace(), 0, NOW)
    expect(result.eligible).toBe(false)
    expect(result.violations).toContain('Дедлайн переселения просрочен')
  })

  it('does not block when the deadline is still ahead', () => {
    const ghost = makeGhost({ deadline: '2030-01-01' })
    const result = evaluate(ghost, makePlace(), 0, NOW)
    expect(result.violations).not.toContain('Дедлайн переселения просрочен')
  })

  it('blocks a no_humans ghost from a place with humans', () => {
    const ghost = makeGhost({ conditions: ['no_humans'] })
    const result = evaluate(ghost, makePlace({ hasHumans: true }), 0, NOW)
    expect(result.eligible).toBe(false)
    expect(result.violations).toContain('В здании живут люди')
  })

  it('does not block a no_humans ghost from a place without humans', () => {
    const ghost = makeGhost({ conditions: ['no_humans'] })
    const result = evaluate(ghost, makePlace({ hasHumans: false }), 0, NOW)
    expect(result.violations).not.toContain('В здании живут люди')
  })

  it('blocks an attic ghost from a place without an attic', () => {
    const ghost = makeGhost({ conditions: ['attic'] })
    const result = evaluate(ghost, makePlace({ hasAttic: false }), 0, NOW)
    expect(result.eligible).toBe(false)
    expect(result.violations).toContain('В здании нет чердака')
  })

  it('does not block an attic ghost from a place with an attic', () => {
    const ghost = makeGhost({ conditions: ['attic'] })
    const result = evaluate(ghost, makePlace({ hasAttic: true }), 0, NOW)
    expect(result.violations).not.toContain('В здании нет чердака')
  })

  it('blocks a no_mirrors ghost from a place with mirrors', () => {
    const ghost = makeGhost({ conditions: ['no_mirrors'] })
    const result = evaluate(ghost, makePlace({ hasMirrors: true }), 0, NOW)
    expect(result.eligible).toBe(false)
    expect(result.violations).toContain('В здании есть зеркала')
  })

  it('does not block a no_mirrors ghost from a place without mirrors', () => {
    const ghost = makeGhost({ conditions: ['no_mirrors'] })
    const result = evaluate(ghost, makePlace({ hasMirrors: false }), 0, NOW)
    expect(result.violations).not.toContain('В здании есть зеркала')
  })

  it('blocks a needs_dark ghost from a place that is too bright', () => {
    const ghost = makeGhost({ conditions: ['needs_dark'] })
    const result = evaluate(ghost, makePlace({ light: 7 }), 0, NOW)
    expect(result.eligible).toBe(false)
    expect(result.violations).toContain('Слишком светло')
  })

  it('does not block a needs_dark ghost from a place at the light threshold', () => {
    const ghost = makeGhost({ conditions: ['needs_dark'] })
    const result = evaluate(ghost, makePlace({ light: 6 }), 0, NOW)
    expect(result.violations).not.toContain('Слишком светло')
  })

  it('collects every violation when a place fails multiple hard checks at once', () => {
    const ghost = makeGhost({ conditions: ['attic', 'no_mirrors'] })
    const place = makePlace({ hasAttic: false, hasMirrors: true })
    const result = evaluate(ghost, place, 0, NOW)
    expect(result.eligible).toBe(false)
    expect(result.violations).toEqual(
      expect.arrayContaining(['В здании нет чердака', 'В здании есть зеркала']),
    )
    expect(result.violations).toHaveLength(2)
  })

  it('returns score: null and breakdown: null when ineligible', () => {
    const result = evaluate(makeGhost(), makePlace({ capacity: 0 }), 0, NOW)
    expect(result.eligible).toBe(false)
    expect(result.score).toBeNull()
    expect(result.breakdown).toBeNull()
  })

  it('returns no violations, a numeric score, and a breakdown when eligible', () => {
    const result = evaluate(makeGhost(), makePlace(), 0, NOW)
    expect(result.eligible).toBe(true)
    expect(result.violations).toEqual([])
    expect(result.score).toEqual(expect.any(Number))
    expect(result.breakdown).not.toBeNull()
  })
})

describe('evaluate — soft score formula', () => {
  it('computes tempScore as 100 minus 8 per degree of difference', () => {
    const ghost = makeGhost({ preferredTemp: 10 })
    const place = makePlace({ temp: 15, noise: 0, humidity: 45 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.tempScore).toBe(60)
  })

  it('clamps tempScore at 0 for a very large temperature gap', () => {
    const ghost = makeGhost({ preferredTemp: -5 })
    const place = makePlace({ temp: 20, noise: 0, humidity: 45 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.tempScore).toBe(0)
  })

  it('computes noiseScore as 100 minus noise times anxiety', () => {
    const ghost = makeGhost({ anxiety: 4, preferredTemp: 10 })
    const place = makePlace({ temp: 10, noise: 5, humidity: 45 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.noiseScore).toBe(80)
  })

  it('clamps noiseScore at 0 for very high noise and anxiety', () => {
    const ghost = makeGhost({ anxiety: 10, preferredTemp: 10 })
    const place = makePlace({ temp: 10, noise: 10, humidity: 45 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.noiseScore).toBe(0)
  })

  it('targets humidity 45 when the ghost does not like damp', () => {
    const ghost = makeGhost({ preferredTemp: 10, conditions: [] })
    const place = makePlace({ temp: 10, noise: 0, humidity: 55 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.humidityScore).toBe(85)
  })

  it('targets humidity 80 when the ghost likes damp', () => {
    const ghost = makeGhost({ preferredTemp: 10, conditions: ['likes_damp'] })
    const place = makePlace({ temp: 10, noise: 0, humidity: 90 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.humidityScore).toBe(85)
  })

  it('combines the three components with weights 0.3/0.4/0.3', () => {
    // tempScore=60, noiseScore=80, humidityScore=85 -> 60*.3+80*.4+85*.3 = 18+32+25.5 = 75.5 -> 76
    const ghost = makeGhost({ preferredTemp: 10, anxiety: 4, conditions: [] })
    const place = makePlace({ temp: 15, noise: 5, humidity: 55 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.tempScore).toBe(60)
    expect(result.breakdown.noiseScore).toBe(80)
    expect(result.breakdown.humidityScore).toBe(85)
    expect(result.score).toBe(76)
  })

  it('does not apply a penalty or warning when the ghost has no needs_quiet condition', () => {
    const ghost = makeGhost({ conditions: [] })
    const place = makePlace({ noise: 9 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.penalty).toBe(0)
    expect(result.breakdown.warnings).toEqual([])
  })

  it('applies a -25 penalty and warning for needs_quiet in a noisy place', () => {
    const ghost = makeGhost({ conditions: ['needs_quiet'], preferredTemp: 10 })
    const place = makePlace({ temp: 10, noise: 6, humidity: 45 })
    const withoutPenalty = evaluate(makeGhost({ preferredTemp: 10 }), place, 0, NOW)
    const withPenalty = evaluate(ghost, place, 0, NOW)
    if (!withoutPenalty.eligible || !withPenalty.eligible) throw new Error('expected eligible')
    expect(withPenalty.breakdown.penalty).toBe(-25)
    expect(withPenalty.breakdown.warnings).toEqual(['Шумно для этого привидения'])
    expect(withPenalty.score).toBe(withoutPenalty.score - 25)
  })

  it('does not apply the needs_quiet penalty at the noise threshold of 5', () => {
    const ghost = makeGhost({ conditions: ['needs_quiet'] })
    const place = makePlace({ noise: 5 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.breakdown.penalty).toBe(0)
    expect(result.breakdown.warnings).toEqual([])
  })

  it('never blocks eligibility for needs_quiet, no matter how noisy the place is', () => {
    const ghost = makeGhost({ conditions: ['needs_quiet'] })
    const place = makePlace({ noise: 10 })
    const result = evaluate(ghost, place, 0, NOW)
    expect(result.eligible).toBe(true)
  })

  it('clamps the final score at 0 after the needs_quiet penalty', () => {
    const ghost = makeGhost({ conditions: ['needs_quiet'], anxiety: 10, preferredTemp: -5 })
    const place = makePlace({ temp: 20, noise: 10, humidity: 0 })
    const result = evaluate(ghost, place, 0, NOW)
    if (!result.eligible) throw new Error('expected eligible')
    expect(result.score).toBe(0)
  })
})

describe('assignAll', () => {
  it('returns empty assignments and unplaced for an empty ghost list', () => {
    const result = assignAll([], [makePlace()], NOW)
    expect(result).toEqual({ assignments: [], unplaced: [] })
  })

  it('assigns a single ghost to its only eligible place', () => {
    const ghost = makeGhost({ id: 'g1' })
    const place = makePlace({ id: 'p1' })
    const result = assignAll([ghost], [place], NOW)
    expect(result.unplaced).toEqual([])
    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0]?.ghost.id).toBe('g1')
    expect(result.assignments[0]?.place.id).toBe('p1')
  })

  it('processes ghosts by deadline ascending, so an earlier deadline claims a full seat first', () => {
    const soloPlace = makePlace({ id: 'solo', capacity: 1 })
    const early = makeGhost({ id: 'early', deadline: '2025-07-01', anxiety: 1 })
    const late = makeGhost({ id: 'late', deadline: '2025-08-01', anxiety: 1 })
    const result = assignAll([late, early], [soloPlace], NOW)
    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0]?.ghost.id).toBe('early')
    expect(result.unplaced.map((g) => g.id)).toEqual(['late'])
  })

  it('breaks a deadline tie by anxiety descending', () => {
    const soloPlace = makePlace({ id: 'solo', capacity: 1 })
    const calm = makeGhost({ id: 'calm', deadline: '2025-07-01', anxiety: 2 })
    const anxious = makeGhost({ id: 'anxious', deadline: '2025-07-01', anxiety: 8 })
    const result = assignAll([calm, anxious], [soloPlace], NOW)
    expect(result.assignments).toHaveLength(1)
    expect(result.assignments[0]?.ghost.id).toBe('anxious')
    expect(result.unplaced.map((g) => g.id)).toEqual(['calm'])
  })

  it('displaces a later-deadline ghost to its runner-up when its top choice fills up', () => {
    const winner = makeGhost({ id: 'winner', deadline: '2025-07-01', preferredTemp: 10 })
    const runnerUp = makeGhost({ id: 'runner-up', deadline: '2025-08-01', preferredTemp: 10 })
    const desired = makePlace({ id: 'desired', capacity: 1, temp: 10 })
    const fallback = makePlace({ id: 'fallback', capacity: 1, temp: 2 })
    const result = assignAll([winner, runnerUp], [desired, fallback], NOW)
    const byGhost = new Map(result.assignments.map((a) => [a.ghost.id, a.place.id]))
    expect(byGhost.get('winner')).toBe('desired')
    expect(byGhost.get('runner-up')).toBe('fallback')
  })

  it('puts a ghost with no eligible place anywhere into unplaced', () => {
    const ghost = makeGhost({ id: 'stuck', conditions: ['attic', 'no_mirrors'] })
    const places = [
      makePlace({ id: 'p1', hasAttic: true, hasMirrors: true }),
      makePlace({ id: 'p2', hasAttic: false, hasMirrors: false }),
    ]
    const result = assignAll([ghost], places, NOW)
    expect(result.assignments).toEqual([])
    expect(result.unplaced.map((g) => g.id)).toEqual(['stuck'])
  })
})

describe('assignAll — seed data integration', () => {
  it('reproduces the four guaranteed scenarios against the real seed data', () => {
    const now = new Date()
    const result = assignAll(seedGhosts, seedPlaces, now)

    expect(result.unplaced.map((g) => g.id).sort()).toEqual(['kassian', 'praskovya'])

    const byGhost = new Map(result.assignments.map((a) => [a.ghost.id, a]))
    expect(byGhost.get('agrafena')?.place.id).toBe('print-shop')
    expect(byGhost.get('agrafena')?.score).toBe(84)
    expect(byGhost.get('rodion')?.place.id).toBe('castle')
    expect(byGhost.get('rodion')?.score).toBe(95)
    expect(byGhost.get('matilda')?.place.id).toBe('theatre')
    expect(byGhost.get('matilda')?.score).toBe(91)
    expect(byGhost.get('efrosinya')?.place.id).toBe('library')
    expect(byGhost.get('efrosinya')?.score).toBe(76)
    expect(byGhost.get('polina')?.place.id).toBe('theatre')
    expect(byGhost.get('polina')?.score).toBe(76)

    expect(result.assignments.some((a) => a.place.id === 'lighthouse')).toBe(false)
  })

  it('gives every place a Russian reason for rejecting Кассиан, and it is more than one distinct reason', () => {
    const now = new Date()
    const kassian = seedGhosts.find((g) => g.id === 'kassian')
    if (!kassian) throw new Error('seed data must contain kassian')

    const reasons = seedPlaces.map((place) => {
      const result = evaluate(kassian, place, 0, now)
      if (result.eligible) throw new Error(`expected ${place.id} to be ineligible for kassian`)
      return result.violations
    })

    expect(reasons.every((v) => v.length > 0)).toBe(true)
    const distinctReasons = new Set(reasons.flat())
    expect(distinctReasons.size).toBeGreaterThan(1)
  })
})

describe('tallyOccupancy', () => {
  it('gives every place a 0 entry when there are no assignments', () => {
    const places = [makePlace({ id: 'p1' }), makePlace({ id: 'p2' })]
    expect(tallyOccupancy(places, [])).toEqual({ p1: 0, p2: 0 })
  })

  it('counts how many assignments land on each place', () => {
    const places = [makePlace({ id: 'p1' }), makePlace({ id: 'p2' })]
    const g1 = makeGhost({ id: 'g1' })
    const g2 = makeGhost({ id: 'g2' })
    const g3 = makeGhost({ id: 'g3' })
    const assignments = [
      { ghost: g1, place: places[0] },
      { ghost: g2, place: places[0] },
      { ghost: g3, place: places[1] },
    ]
    expect(tallyOccupancy(places, assignments)).toEqual({ p1: 2, p2: 1 })
  })
})

describe('rankCandidates', () => {
  it('returns every place, not just the winner', () => {
    const places = [makePlace({ id: 'p1' }), makePlace({ id: 'p2' }), makePlace({ id: 'p3' })]
    const occupancy = tallyOccupancy(places, [])
    const ranked = rankCandidates(makeGhost(), places, occupancy, NOW)
    expect(ranked).toHaveLength(3)
  })

  it('sorts eligible places by score descending', () => {
    const close = makePlace({ id: 'close', temp: 10, noise: 0, humidity: 45 })
    const far = makePlace({ id: 'far', temp: 18, noise: 0, humidity: 45 })
    const ghost = makeGhost({ preferredTemp: 10 })
    const occupancy = tallyOccupancy([close, far], [])
    const ranked = rankCandidates(ghost, [far, close], occupancy, NOW)
    expect(ranked.map((r) => r.place.id)).toEqual(['close', 'far'])
  })

  it('puts ineligible places after eligible ones, in their original order', () => {
    const eligible = makePlace({ id: 'eligible', capacity: 5 })
    const blockedA = makePlace({ id: 'blocked-a', capacity: 0 })
    const blockedB = makePlace({ id: 'blocked-b', capacity: 0 })
    const ghost = makeGhost()
    const occupancy = tallyOccupancy([blockedA, eligible, blockedB], [])
    const ranked = rankCandidates(ghost, [blockedA, eligible, blockedB], occupancy, NOW)
    expect(ranked.map((r) => r.place.id)).toEqual(['eligible', 'blocked-a', 'blocked-b'])
    expect(ranked[1]?.evaluation.eligible).toBe(false)
    expect(ranked[2]?.evaluation.eligible).toBe(false)
  })

  it('exposes violations for every place when a ghost is unplaceable everywhere', () => {
    const now = new Date()
    const kassian = seedGhosts.find((g) => g.id === 'kassian')
    if (!kassian) throw new Error('seed data must contain kassian')
    const occupancy = tallyOccupancy(seedPlaces, [])
    const ranked = rankCandidates(kassian, seedPlaces, occupancy, now)
    expect(ranked).toHaveLength(seedPlaces.length)
    expect(ranked.every((r) => !r.evaluation.eligible && r.evaluation.violations.length > 0)).toBe(
      true,
    )
  })

  it('respects the given occupancy map for the capacity check', () => {
    const place = makePlace({ id: 'p1', capacity: 1 })
    const ghost = makeGhost()
    const full = rankCandidates(ghost, [place], { p1: 1 }, NOW)
    const empty = rankCandidates(ghost, [place], { p1: 0 }, NOW)
    expect(full[0]?.evaluation.eligible).toBe(false)
    expect(empty[0]?.evaluation.eligible).toBe(true)
  })
})
