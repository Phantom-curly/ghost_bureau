import type { Ghost } from '../domain/types'
import { daysFromNow } from './dates'

export const ghosts: Ghost[] = [
  {
    id: 'praskovya',
    name: 'Прасковья Опоздавшая',
    anxiety: 5,
    preferredTemp: 10,
    // Deadline is always in the past: this ghost is unplaceable everywhere regardless of
    // conditions, which is the point — it's the "deadline already passed" scenario.
    deadline: daysFromNow(-30),
    conditions: [],
    note: 'Всё бюро потеряло её документы ещё в прошлом году.',
  },
  {
    id: 'agrafena',
    name: 'Аграфена Мокрицына',
    anxiety: 4,
    preferredTemp: 14,
    deadline: daysFromNow(20),
    conditions: ['likes_damp'],
    note: 'Мечтает поселиться там, где пахнет типографской краской и сыростью.',
  },
  {
    id: 'rodion',
    name: 'Родион Безлюдный',
    anxiety: 4,
    preferredTemp: 8,
    deadline: daysFromNow(35),
    conditions: ['no_humans'],
    note: 'Согласен на что угодно, лишь бы поблизости не было живых людей.',
  },
  {
    id: 'matilda',
    name: 'Матильда Ветрова',
    anxiety: 3,
    preferredTemp: 12,
    // Same deadline as Ефросинья on purpose, with different anxiety — exercises the
    // anxiety-descending tie-break rule in assignAll.
    deadline: daysFromNow(50),
    conditions: ['needs_dark'],
    note: 'Обожает старые кулисы и полумрак сцены.',
  },
  {
    id: 'efrosinya',
    name: 'Ефросинья Тихая',
    anxiety: 5,
    preferredTemp: 18,
    deadline: daysFromNow(50),
    conditions: ['needs_quiet', 'likes_damp'],
    note: 'Ценит тишину читального зала больше, чем скрип половиц.',
  },
  {
    id: 'polina',
    name: 'Полина Сумеречная',
    anxiety: 2,
    preferredTemp: 16,
    // Scores higher at the print shop than Аграфена does, but her deadline is later, so
    // greedy assignment gives the one seat there to Аграфена first and displaces Полина to
    // her runner-up choice — the concrete "greedy isn't globally optimal" example.
    deadline: daysFromNow(80),
    conditions: ['likes_damp'],
    note: 'Тоже была бы не прочь пожить в подвале типографии, но опоздала.',
  },
  {
    id: 'kassian',
    name: 'Кассиан Чердаков',
    anxiety: 6,
    preferredTemp: 0,
    deadline: daysFromNow(140),
    // Unplaceable by combination, not a single impossible field: only the castle has an
    // attic, but the castle also has mirrors, so no place satisfies both conditions at once.
    conditions: ['attic', 'no_mirrors'],
    note: 'Не выносит собственного отражения, но жить может только под самой крышей.',
  },
]
