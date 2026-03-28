import { formatMetricValue } from '../lib/format'
import type { SpotlightMetricResult } from '../types'

interface MetricComparisonProps {
  metrics: SpotlightMetricResult[]
  targetLabel: string
  candidateLabel: string
}

export function MetricComparison({
  metrics,
  targetLabel,
  candidateLabel,
}: MetricComparisonProps) {
  return (
    <div className="metric-comparison">
      {metrics.map((metric) => (
        <div key={metric.key} className="metric-row">
          <div className="metric-row-header">
            <strong>{metric.label}</strong>
            <span className="metric-meta">
              {targetLabel} {formatMetricValue(metric.targetValue, metric.format)} ·{' '}
              {candidateLabel} {formatMetricValue(metric.candidateValue, metric.format)}
            </span>
          </div>

          <div className="metric-bars">
            <div>
              <p className="metric-comparison-copy">{targetLabel}</p>
              <div className="metric-track">
                <div
                  className="metric-fill target"
                  style={{ width: `${metric.targetPercentile}%` }}
                />
              </div>
            </div>

            <div>
              <p className="metric-comparison-copy">{candidateLabel}</p>
              <div className="metric-track">
                <div
                  className="metric-fill candidate"
                  style={{ width: `${metric.candidatePercentile}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
