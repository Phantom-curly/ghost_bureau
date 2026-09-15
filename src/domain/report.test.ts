import { describe, expect, it } from 'vitest'
import { rankByViolations, rankPlaceDemand } from './report'
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

describe('rankByViolations', () => {
  it('returns an empty list for an empty ghost list', () => {
    expect(rankByViolations([], [makePlace()], NOW)).toEqual([])
  })

  it('gives a ghost with no blocking conditions a violation count of 0', () => {
    const ghost = makeGhost({ id: 'easy' })
    const places = [makePlace({ id: 'p1' }), makePlace({ id: 'p2' })]
    const [result] = rankByViolations([ghost], places, NOW)
    expect(result?.violationCount).toBe(0)
  })

  it('counts violations across every place, not just one', () => {
    const ghost = makeGhost({ id: 'hard', conditions: ['attic'] })
    const places = [
      makePlace({ id: 'p1', hasAttic: false }),
      makePlace({ id: 'p2', hasAttic: false }),
      makePlace({ id: 'p3', hasAttic: true }),
    ]
    const [result] = rankByViolations([ghost], places, NOW)
    expect(result?.violationCount).toBe(2)
  })

  it('sorts ghosts by violation count descending', () => {
    const easy = makeGhost({ id: 'easy' })
    const hard = makeGhost({ id: 'hard', conditions: ['attic', 'no_mirrors'] })
    const places = [makePlace({ id: 'p1', hasAttic: false, hasMirrors: true })]
    const ranked = rankByViolations([easy, hard], places, NOW)
    expect(ranked.map((r) => r.ghost.id)).toEqual(['hard', 'easy'])
  })

  it('is not affected by capacity, since it measures structural fit, not current occupancy', () => {
    const ghost = makeGhost({ id: 'g1' })
    const fullPlace = makePlace({ id: 'p1', capacity: 0 })
    const [result] = rankByViolations([ghost], [fullPlace], NOW)
    // capacity 0 is a genuine structural fact about the place (it can never hold anyone),
    // so it still counts as a violation — the baseline just never lets OTHER ghosts' seats
    // artificially block this one.
    expect(result?.violationCount).toBe(1)
  })

  it('ranks Кассиан and Прасковья as the most problematic in the real seed data', () => {
    const now = new Date()
    const ranked = rankByViolations(seedGhosts, seedPlaces, now)
    expect(ranked[0]?.ghost.id).toBe('kassian')
    expect(ranked[0]?.violationCount).toBe(6)
    expect(ranked[1]?.ghost.id).toBe('praskovya')
    expect(ranked[1]?.violationCount).toBe(5)
  })
})

describe('rankPlaceDemand', () => {
  it('gives every place 0 demand and overloaded: false for an empty ghost list', () => {
    const places = [makePlace({ id: 'p1', capacity: 1 }), makePlace({ id: 'p2', capacity: 1 })]
    const ranked = rankPlaceDemand([], places, NOW)
    expect(ranked).toEqual([
      { place: places[0], demand: 0, overloaded: false },
      { place: places[1], demand: 0, overloaded: false },
    ])
  })

  it('flags a place as overloaded when more ghosts want it than it can hold', () => {
    const place = makePlace({ id: 'popular', capacity: 1, temp: 10 })
    const other = makePlace({ id: 'other', capacity: 5, temp: -5 })
    const g1 = makeGhost({ id: 'g1', preferredTemp: 10 })
    const g2 = makeGhost({ id: 'g2', preferredTemp: 10 })
    const ranked = rankPlaceDemand([g1, g2], [place, other], NOW)
    const popular = ranked.find((r) => r.place.id === 'popular')
    expect(popular?.demand).toBe(2)
    expect(popular?.overloaded).toBe(true)
  })

  it('does not flag a place as overloaded when demand is within capacity', () => {
    const place = makePlace({ id: 'roomy', capacity: 5 })
    const ghost = makeGhost({ id: 'g1' })
    const ranked = rankPlaceDemand([ghost], [place], NOW)
    expect(ranked[0]?.demand).toBe(1)
    expect(ranked[0]?.overloaded).toBe(false)
  })

  it('does not count a ghost with no eligible places toward any place\'s demand', () => {
    const place = makePlace({ id: 'p1', hasAttic: false })
    const ghost = makeGhost({ id: 'stuck', conditions: ['attic'] })
    const ranked = rankPlaceDemand([ghost], [place], NOW)
    expect(ranked[0]?.demand).toBe(0)
  })

  it('flags the real print shop as overloaded in the seed data (demand 2, capacity 1)', () => {
    const now = new Date()
    const ranked = rankPlaceDemand(seedGhosts, seedPlaces, now)
    const printShop = ranked.find((r) => r.place.id === 'print-shop')
    expect(printShop?.demand).toBe(2)
    expect(printShop?.overloaded).toBe(true)
    const overloaded = ranked.filter((r) => r.overloaded)
    expect(overloaded.map((r) => r.place.id)).toEqual(['print-shop'])
  })
})
