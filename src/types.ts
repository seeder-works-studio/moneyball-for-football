export type DatasetKey = 'outfield' | 'goalkeeper'

export type MetricFormat = 'number' | 'percent' | 'integer'

export interface MetricDefinition {
  key: string
  label: string
  format: MetricFormat
}

export interface PlayerRecord {
  id: string
  dataset: DatasetKey
  player: string
  nation: string
  pos: string
  squad: string
  comp: string
  age: number
  minutes: number
  starts: number
  seasonsTop5: number
  metrics: Record<string, number>
}

export interface DatasetBundle {
  key: DatasetKey
  label: string
  metricDefinitions: Record<string, MetricDefinition>
  players: PlayerRecord[]
}

export interface ScoutingData {
  meta: {
    generatedAt: string
    sourceModel: string
    totalPlayers: number
  }
  datasets: Record<DatasetKey, DatasetBundle>
}

export interface RolePreset {
  id: string
  dataset: DatasetKey
  label: string
  description: string
  eligiblePositions: string[]
  metrics: string[]
  spotlightMetrics: string[]
  defaultPlayer: string
}

export interface SimilarityResult {
  player: PlayerRecord
  similarity: number
}

export interface SpotlightMetricResult {
  key: string
  label: string
  format: MetricFormat
  targetValue: number
  candidateValue: number
  targetPercentile: number
  candidatePercentile: number
}
