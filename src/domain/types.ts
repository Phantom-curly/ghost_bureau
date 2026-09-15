export type Condition =
  | 'attic'
  | 'no_mirrors'
  | 'no_humans'
  | 'likes_damp'
  | 'needs_dark'
  | 'needs_quiet'

export type Ghost = {
  id: string
  name: string
  anxiety: number
  preferredTemp: { min: number; max: number }
  deadline: string
  conditions: Condition[]
  note: string
}

export type Place = {
  id: string
  name: string
  capacity: number
  light: number
  noise: number
  humidity: number
  temp: number
  hasHumans: boolean
  hasAttic: boolean
  hasMirrors: boolean
  restriction: string | null
}
