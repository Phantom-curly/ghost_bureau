import { rankByViolations, rankPlaceDemand } from '../domain/report'
import type { Ghost, Place } from '../domain/types'

type ReportTabProps = {
  ghosts: Ghost[]
  places: Place[]
  effectiveAssignments: Array<{ ghost: Ghost; place: Place }>
  now: Date
}

export function ReportTab({ ghosts, places, effectiveAssignments, now }: ReportTabProps) {
  if (ghosts.length === 0) {
    return <p className="empty-state">Заявок нет — отчёт строить не по чему.</p>
  }

  const placedIds = new Set(effectiveAssignments.map((a) => a.ghost.id))
  const unplacedGhosts = ghosts.filter((ghost) => !placedIds.has(ghost.id))
  const problematic = rankByViolations(ghosts, places, now)
  const demand = rankPlaceDemand(ghosts, places, now)

  return (
    <div className="report">
      <section>
        <h2>Размещение</h2>
        <p>
          Размещено {effectiveAssignments.length} из {ghosts.length}, не размещено{' '}
          {unplacedGhosts.length}.
        </p>
        <ul>
          {effectiveAssignments.map((a) => (
            <li key={a.ghost.id}>
              {a.ghost.name} — {a.place.name}
            </li>
          ))}
          {unplacedGhosts.map((ghost) => (
            <li key={ghost.id} className="ineligible">
              {ghost.name} — не размещено
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Самые проблемные заявки</h2>
        <p className="breakdown">Число нарушений по всем местам, от наибольшего к наименьшему.</p>
        <ul>
          {problematic.map(({ ghost, violationCount }) => (
            <li key={ghost.id}>
              {ghost.name} — нарушений: {violationCount}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Перегруженные локации</h2>
        <p className="breakdown">Спрос — сколько привидений выбрали бы это место лучшим, независимо от вместимости.</p>
        <ul>
          {demand.map(({ place, demand: count, overloaded }) => (
            <li key={place.id} className={overloaded ? 'ineligible' : undefined}>
              {place.name} — спрос {count}, вместимость {place.capacity}
              {overloaded && ' (перегружено)'}
            </li>
          ))}
        </ul>
      </section>

      <section className="honest-note">
        <h2>Честно о жадном алгоритме</h2>
        <p>
          Распределение выполняется жадно: привидения обрабатываются по возрастанию дедлайна, и
          каждое получает лучшее из ещё свободных мест на момент своей очереди. Это не глобально
          оптимальное решение. Например, в текущей заявке Аграфена Мокрицына получает Подвал
          типографии с баллом 84, потому что её дедлайн раньше — хотя у Полины Сумеречной балл за
          то же место был бы выше (85). Полину вытесняют в Заброшенный театр. Перестановка их
          местами дала бы более высокий суммарный балл, но алгоритм этого не видит: он решает по
          очереди, а не глобально.
        </p>
      </section>
    </div>
  )
}
