import type { Ghost } from '../domain/types'
import { daysFromNow } from './dates'

export const ghosts: Ghost[] = [
  {
    id: 'praskovya',
    name: 'Прасковья Опоздавшая',
    anxiety: 5,
    preferredTemp: { min: 8, max: 13 },
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
    // Wide/tolerant band: she's particular about print-shop's damp, ink-smelling
    // atmosphere (the whole point of her note below), not about exact degrees.
    preferredTemp: { min: 10, max: 17 },
    deadline: daysFromNow(20),
    conditions: ['likes_damp'],
    note: 'Мечтает поселиться там, где пахнет типографской краской и сыростью.',
  },
  {
    id: 'rodion',
    name: 'Родион Безлюдный',
    anxiety: 4,
    // Widest band of all seven: "agrees to anything as long as no living people
    // nearby" is a statement about temperature tolerance too, not just company.
    preferredTemp: { min: 4, max: 12 },
    deadline: daysFromNow(35),
    conditions: ['no_humans'],
    note: 'Согласен на что угодно, лишь бы поблизости не было живых людей.',
  },
  {
    id: 'matilda',
    name: 'Матильда Ветрова',
    anxiety: 3,
    preferredTemp: { min: 10, max: 15 },
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
    // Narrowest band: values precision (quiet reading room over floor creaks) —
    // the fussiest ghost of the seven.
    preferredTemp: { min: 16, max: 20 },
    deadline: daysFromNow(50),
    conditions: ['needs_quiet', 'likes_damp'],
    note: 'Ценит тишину читального зала больше, чем скрип половиц.',
  },
  {
    id: 'polina',
    name: 'Полина Сумеречная',
    anxiety: 2,
    // Tolerant, adaptable band, matching her "wouldn't mind print-shop either" note.
    preferredTemp: { min: 13, max: 19 },
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
    preferredTemp: { min: -3, max: 3 },
    deadline: daysFromNow(140),
    // Unplaceable by combination, not a single impossible field: only the castle has an
    // attic, but the castle also has mirrors, so no place satisfies both conditions at once.
    conditions: ['attic', 'no_mirrors'],
    note: 'Не выносит собственного отражения, но жить может только под самой крышей.',
  },
  // Deadlines below are all deliberately later than every currently-placed ghost above
  // (Аграфена +20, Родион +35, Матильда/Ефросинья +50, Полина +80) and later than Кассиан's
  // +140 too, so assignAll's deadline-ascending order processes all seven original ghosts to
  // completion first — their actual assignments cannot be disturbed by anything below.
  {
    id: 'ustinya',
    name: 'Устинья Шумная',
    anxiety: 3,
    preferredTemp: { min: 8, max: 14 },
    deadline: daysFromNow(145),
    conditions: [],
    note: 'Ей всё равно, где жить, лишь бы не было тесно.',
  },
  {
    id: 'zhdana',
    name: 'Ждана Скрытная',
    anxiety: 5,
    preferredTemp: { min: 0, max: 6 },
    deadline: daysFromNow(148),
    conditions: ['needs_dark', 'no_mirrors'],
    note: 'Не выносит ни яркого света, ни собственного отражения.',
  },
  {
    id: 'ignaty',
    name: 'Игнатий Стекольщик',
    anxiety: 4,
    preferredTemp: { min: 5, max: 12 },
    deadline: daysFromNow(150),
    conditions: ['no_mirrors'],
    note: 'Всю жизнь резал стекло и теперь его сторонится.',
  },
  {
    id: 'fevrusa',
    name: 'Февруса Путевая',
    anxiety: 6,
    preferredTemp: { min: 2, max: 9 },
    deadline: daysFromNow(152),
    conditions: ['no_humans'],
    note: 'Любит дорогу, но не любит попутчиков.',
  },
  {
    id: 'lukerya',
    name: 'Лукерья Подземная',
    anxiety: 4,
    preferredTemp: { min: 4, max: 10 },
    // Earlier deadline than Мокей below, and both prefer the crypt — mirrors the
    // Аграфена/Полина print-shop story, but self-contained among the new ghosts.
    deadline: daysFromNow(155),
    conditions: ['likes_damp', 'no_humans'],
    note: 'Мечтает о сырых сводах старой крипты.',
  },
  {
    id: 'vseslava',
    name: 'Всеслава Безмолвная',
    anxiety: 8,
    preferredTemp: { min: 6, max: 13 },
    deadline: daysFromNow(160),
    conditions: ['needs_quiet'],
    note: 'Любой скрип выводит её из себя.',
  },
  {
    id: 'mokey',
    name: 'Мокей Сырой',
    anxiety: 3,
    preferredTemp: { min: 3, max: 11 },
    deadline: daysFromNow(165),
    conditions: ['likes_damp'],
    note: 'Тоже был бы не прочь поселиться в крипте.',
  },
  {
    id: 'porfiry',
    name: 'Порфирий Мансардов',
    anxiety: 5,
    preferredTemp: { min: -4, max: 2 },
    deadline: daysFromNow(170),
    // Unplaceable by the same combination as Кассиан: castle is still the only place with an
    // attic, and it still has mirrors. A second applicant proves it's a structural gap in the
    // building roster, not a one-off fluke of Кассиан's specific profile.
    conditions: ['attic', 'no_mirrors'],
    note: 'Ищет чердак, но, как и Кассиан, не выносит зеркал.',
  },
  {
    id: 'rodislav',
    name: 'Родислав Наблюдательный',
    anxiety: 2,
    preferredTemp: { min: -2, max: 4 },
    deadline: daysFromNow(175),
    conditions: ['needs_dark'],
    note: 'Ночи напролёт смотрит в купол обсерватории.',
  },
  {
    id: 'agafon',
    name: 'Агафон Забытый',
    anxiety: 5,
    preferredTemp: { min: 9, max: 15 },
    // A second "deadline already passed" ghost — safe regardless of ordering, since an
    // expired deadline blocks every place and this ghost can never claim a seat.
    deadline: daysFromNow(-10),
    conditions: [],
    note: 'Его заявку тоже потеряли, но совсем по другому адресу.',
  },
]
