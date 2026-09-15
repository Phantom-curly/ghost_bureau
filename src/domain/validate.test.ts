import { describe, expect, it } from 'vitest'
import { validateData } from './validate'
import { ghosts as seedGhosts } from '../data/ghosts'
import { places as seedPlaces } from '../data/places'
import type { Ghost, Place } from './types'

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

describe('validateData', () => {
  it('accepts the real seed data', () => {
    expect(validateData(seedGhosts, seedPlaces)).toEqual({ valid: true })
  })

  it('accepts an empty ghost list — that is a legitimate app state, not bad data', () => {
    expect(validateData([], seedPlaces)).toEqual({ valid: true })
  })

  it('rejects duplicate ghost ids', () => {
    const ghosts = [makeGhost({ id: 'dup' }), makeGhost({ id: 'dup' })]
    const result = validateData(ghosts, [makePlace()])
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid')
    expect(result.errors.some((e) => e.includes('dup'))).toBe(true)
  })

  it('rejects duplicate place ids', () => {
    const places = [makePlace({ id: 'dup' }), makePlace({ id: 'dup' })]
    const result = validateData([makeGhost()], places)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid')
    expect(result.errors.some((e) => e.includes('dup'))).toBe(true)
  })

  it('rejects a place with negative capacity', () => {
    const places = [makePlace({ id: 'p1', capacity: -1 })]
    const result = validateData([makeGhost()], places)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid')
    expect(result.errors.some((e) => e.includes('p1'))).toBe(true)
  })

  it('accepts a place with zero capacity — that is valid, just always full', () => {
    const places = [makePlace({ id: 'p1', capacity: 0 })]
    expect(validateData([makeGhost()], places)).toEqual({ valid: true })
  })

  it('rejects a ghost with an unparseable deadline', () => {
    const ghosts = [makeGhost({ id: 'g1', deadline: 'not-a-date' })]
    const result = validateData(ghosts, [makePlace()])
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid')
    expect(result.errors.some((e) => e.includes('g1'))).toBe(true)
  })

  it('reports every problem at once, not just the first', () => {
    const ghosts = [makeGhost({ id: 'g1', deadline: 'garbage' })]
    const places = [makePlace({ id: 'p1', capacity: -5 })]
    const result = validateData(ghosts, places)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('expected invalid')
    expect(result.errors).toHaveLength(2)
  })
})
