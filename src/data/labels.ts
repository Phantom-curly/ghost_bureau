import type { Condition } from '../domain/types'

export const CONDITION_LABELS: Record<Condition, string> = {
  attic: 'нужен чердак',
  no_mirrors: 'боится зеркал',
  no_humans: 'нельзя рядом с людьми',
  likes_damp: 'любит сырость',
  needs_dark: 'не переносит яркий свет',
  needs_quiet: 'требует тишины',
}

// Mirrors the exact Russian reason strings matching.ts's hard-constraint checks produce, so a
// condition tag can be marked violated for the currently selected location by checking whether
// its reason appears in that location's violations. Only conditions that can actually cause a
// hard-constraint violation appear here — likes_damp and needs_quiet only affect score, never
// eligibility, so they have no violation reason to match against.
export const CONDITION_VIOLATION_REASON: Partial<Record<Condition, string>> = {
  attic: 'В здании нет чердака',
  no_mirrors: 'В здании есть зеркала',
  no_humans: 'В здании живут люди',
  needs_dark: 'Слишком светло',
}
