import { getPresetById, getPresetsForDataset } from '../data/presets'
import type {
  DatasetKey,
  PlayerRecord,
  RolePreset,
  SimilarityResult,
  SpotlightMetricResult,
} from '../types'

export { getPresetById, getPresetsForDataset }

interface AnalysisFilters {
  minMinutes: number
  maxAge: number
  excludeSameSquad: boolean
  onlyTopFiveVeterans: boolean
}

interface AnalyzeTargetArgs {
  players: PlayerRecord[]
  target: PlayerRecord
  preset: RolePreset
  filters: AnalysisFilters
}

interface AnalyzeTargetResult {
  recommendations: SimilarityResult[]
  poolSize: number
  removedPlayers: number
  spotlightMetrics: SpotlightMetricResult[]
}

function metricValue(player: PlayerRecord, key: string): number {
  return player.metrics[key] ?? 0
}

function normalizePositionFragments(position: string): string[] {
  return position
    .split(',')
    .map((fragment) => fragment.trim())
    .filter(Boolean)
}

function matchesPresetPosition(player: PlayerRecord, preset: RolePreset): boolean {
  const fragments = normalizePositionFragments(player.pos)
  return fragments.some((fragment) => preset.eligiblePositions.includes(fragment))
}

export function getEligiblePlayers(
  players: PlayerRecord[],
  preset: RolePreset,
): PlayerRecord[] {
  return players.filter((player) => matchesPresetPosition(player, preset))
}

export function getSearchFilteredPlayers(
  players: PlayerRecord[],
  query: string,
): PlayerRecord[] {
  const normalized = query.trim().toLowerCase()

  return players
    .filter((player) => {
      if (!normalized) {
        return true
      }

      const haystack = `${player.player} ${player.squad} ${player.comp}`.toLowerCase()
      return haystack.includes(normalized)
    })
    .sort((left, right) => left.player.localeCompare(right.player))
}

export function getDefaultPlayerId(
  datasetKey: DatasetKey,
  presetId: string,
  players: PlayerRecord[],
): string | null {
  const preset = getPresetById(datasetKey, presetId)

  if (!preset) {
    return players[0]?.id ?? null
  }

  const exact = players.find((player) => player.player === preset.defaultPlayer)
  return exact?.id ?? players[0]?.id ?? null
}

function buildFilteredPool(
  players: PlayerRecord[],
  target: PlayerRecord,
  filters: AnalysisFilters,
): PlayerRecord[] {
  return players.filter((player) => {
    if (player.id === target.id) {
      return false
    }

    if (player.minutes < filters.minMinutes) {
      return false
    }

    if (player.age > filters.maxAge) {
      return false
    }

    if (filters.excludeSameSquad && player.squad === target.squad) {
      return false
    }

    if (filters.onlyTopFiveVeterans && player.seasonsTop5 < 2) {
      return false
    }

    return true
  })
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function stdDev(values: number[], currentMean: number): number {
  const variance =
    values.reduce((sum, value) => sum + (value - currentMean) ** 2, 0) /
    values.length
  return Math.sqrt(variance)
}

function zScore(value: number, currentMean: number, currentStdDev: number): number {
  if (!Number.isFinite(currentStdDev) || currentStdDev === 0) {
    return 0
  }

  return (value - currentMean) / currentStdDev
}

function cosineSimilarity(left: number[], right: number[]): number {
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftMagnitude += left[index] * left[index]
    rightMagnitude += right[index] * right[index]
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

function percentileForValue(values: number[], value: number): number {
  const sorted = [...values].sort((left, right) => left - right)
  const lessOrEqualCount = sorted.filter((candidate) => candidate <= value).length
  return Math.round((lessOrEqualCount / sorted.length) * 100)
}

export function analyzeTarget({
  players,
  target,
  preset,
  filters,
}: AnalyzeTargetArgs): AnalyzeTargetResult {
  const filteredPool = buildFilteredPool(players, target, filters)
  const scalingPool = [target, ...filteredPool]

  const metricStats = preset.metrics.map((metricKey) => {
    const values = scalingPool.map((player) => metricValue(player, metricKey))
    const currentMean = mean(values)
    const currentStdDev = stdDev(values, currentMean)

    return {
      metricKey,
      values,
      currentMean,
      currentStdDev,
    }
  })

  const targetVector = metricStats.map((stat) =>
    zScore(metricValue(target, stat.metricKey), stat.currentMean, stat.currentStdDev),
  )

  const recommendations = filteredPool
    .map((player) => {
      const candidateVector = metricStats.map((stat) =>
        zScore(
          metricValue(player, stat.metricKey),
          stat.currentMean,
          stat.currentStdDev,
        ),
      )

      return {
        player,
        similarity: Math.max(0, cosineSimilarity(targetVector, candidateVector) * 100),
      }
    })
    .sort((left, right) => right.similarity - left.similarity)

  const topCandidate = recommendations[0]?.player
  const spotlightMetrics: SpotlightMetricResult[] = topCandidate
    ? preset.spotlightMetrics.map((metricKey) => {
        const allValues = scalingPool.map((player) => metricValue(player, metricKey))
        const targetValue = metricValue(target, metricKey)
        const candidateValue = metricValue(topCandidate, metricKey)

        return {
          key: metricKey,
          label: metricKey,
          format: 'number',
          targetValue,
          candidateValue,
          targetPercentile: percentileForValue(allValues, targetValue),
          candidatePercentile: percentileForValue(allValues, candidateValue),
        }
      })
    : []

  return {
    recommendations,
    poolSize: filteredPool.length,
    removedPlayers: players.length - 1 - filteredPool.length,
    spotlightMetrics,
  }
}
