import type { Ghost, Place } from './types'

export type ValidationResult = { valid: true } | { valid: false; errors: string[] }

function findDuplicateIds(items: Array<{ id: string }>): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.add(item.id)
    }
    seen.add(item.id)
  }
  return [...duplicates]
}

function validateGhosts(ghosts: Ghost[]): string[] {
  const errors: string[] = []

  for (const id of findDuplicateIds(ghosts)) {
    errors.push(`Повторяющийся идентификатор привидения: «${id}»`)
  }

  for (const ghost of ghosts) {
    if (Number.isNaN(new Date(ghost.deadline).getTime())) {
      errors.push(`У привидения «${ghost.id}» некорректный дедлайн: «${ghost.deadline}»`)
    }
  }

  return errors
}

function validatePlaces(places: Place[]): string[] {
  const errors: string[] = []

  for (const id of findDuplicateIds(places)) {
    errors.push(`Повторяющийся идентификатор места: «${id}»`)
  }

  for (const place of places) {
    if (place.capacity < 0) {
      errors.push(`У места «${place.id}» отрицательная вместимость: ${place.capacity}`)
    }
  }

  return errors
}

export function validateData(ghosts: Ghost[], places: Place[]): ValidationResult {
  const errors = [...validateGhosts(ghosts), ...validatePlaces(places)]
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  return { valid: true }
}
