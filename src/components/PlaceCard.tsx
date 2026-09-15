import type { Ghost, Place } from '../domain/types'

type PlaceCardProps = {
  place: Place
  occupants: Ghost[]
}

export function PlaceCard({ place, occupants }: PlaceCardProps) {
  const isFull = occupants.length >= place.capacity

  return (
    <li className="place-card">
      <div className="place-header">
        <h3>{place.name}</h3>
        <span className={isFull ? 'capacity capacity-full' : 'capacity'}>
          {occupants.length} / {place.capacity}
        </span>
      </div>

      <div className="place-tags">
        <span className={place.hasAttic ? 'tag' : 'tag tag-neutral-off'}>
          {place.hasAttic ? 'есть чердак' : 'нет чердака'}
        </span>
        <span className={place.hasMirrors ? 'tag' : 'tag tag-neutral-off'}>
          {place.hasMirrors ? 'есть зеркала' : 'нет зеркал'}
        </span>
        <span className={place.hasHumans ? 'tag' : 'tag tag-neutral-off'}>
          {place.hasHumans ? 'живут люди' : 'нет людей'}
        </span>
      </div>

      <dl className="place-attributes">
        <dt>Освещение</dt>
        <dd>{place.light} из 10</dd>
        <dt>Уровень шума</dt>
        <dd>{place.noise} из 10</dd>
        <dt>Влажность</dt>
        <dd>{place.humidity} %</dd>
        <dt>Температура</dt>
        <dd>{place.temp} °C</dd>
        <dt>Наличие людей</dt>
        <dd>{place.hasHumans ? 'да' : 'нет'}</dd>
        <dt>Ограничение</dt>
        <dd>{place.restriction ?? 'без ограничений'}</dd>
      </dl>

      <div className="place-occupants">
        <p className="candidates-heading">Кто здесь живёт:</p>
        {occupants.length === 0 ? (
          <p className="empty-state">Сейчас здесь никто не живёт.</p>
        ) : (
          <ul>
            {occupants.map((ghost) => (
              <li key={ghost.id}>{ghost.name}</li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
