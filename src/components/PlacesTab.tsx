import { occupantsByPlace } from '../domain/matching'
import type { Ghost, Place } from '../domain/types'
import { PlaceCard } from './PlaceCard'

type PlacesTabProps = {
  places: Place[]
  effectiveAssignments: Array<{ ghost: Ghost; place: Place }>
}

export function PlacesTab({ places, effectiveAssignments }: PlacesTabProps) {
  const occupants = occupantsByPlace(places, effectiveAssignments)

  return (
    <ul className="place-list">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} occupants={occupants.get(place.id) ?? []} />
      ))}
    </ul>
  )
}
