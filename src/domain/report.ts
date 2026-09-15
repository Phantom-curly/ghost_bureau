import { rankCandidates, tallyOccupancy } from './matching'
import type { Ghost, Place } from './types'

export type ProblematicGhost = { ghost: Ghost; violationCount: number }

export function rankByViolations(ghosts: Ghost[], places: Place[], now: Date): ProblematicGhost[] {
  const occupancy = tallyOccupancy(places, [])
  return ghosts
    .map((ghost) => {
      const candidates = rankCandidates(ghost, places, occupancy, now)
      const violationCount = candidates.reduce(
        (sum, candidate) => sum + candidate.evaluation.violations.length,
        0,
      )
      return { ghost, violationCount }
    })
    .sort((a, b) => b.violationCount - a.violationCount)
}

export type PlaceDemand = { place: Place; demand: number; overloaded: boolean }

export function rankPlaceDemand(ghosts: Ghost[], places: Place[], now: Date): PlaceDemand[] {
  const occupancy = tallyOccupancy(places, [])
  const topChoiceCounts: Record<string, number> = Object.fromEntries(places.map((p) => [p.id, 0]))

  for (const ghost of ghosts) {
    const [top] = rankCandidates(ghost, places, occupancy, now)
    if (top?.evaluation.eligible) {
      topChoiceCounts[top.place.id] += 1
    }
  }

  return places
    .map((place) => {
      const demand = topChoiceCounts[place.id]
      return { place, demand, overloaded: demand > place.capacity }
    })
    .sort((a, b) => b.demand - a.demand)
}
