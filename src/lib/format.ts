import type { MetricFormat } from '../types'

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatAge(value: number): string {
  return `${value} years old`
}

export function formatLeagueName(value: string): string {
  return value
    .replace('eng Premier League', 'Premier League')
    .replace('es La Liga', 'La Liga')
    .replace('it Serie A', 'Serie A')
    .replace('de Bundesliga', 'Bundesliga')
    .replace('fr Ligue 1', 'Ligue 1')
}

export function formatPosition(value: string): string {
  return value.replaceAll(',', ' / ')
}

export function formatMetricValue(value: number, format: MetricFormat): string {
  if (format === 'percent') {
    return `${value.toFixed(1)}%`
  }

  if (format === 'integer') {
    return Math.round(value).toString()
  }

  return value.toFixed(2)
}
