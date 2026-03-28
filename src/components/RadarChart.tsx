interface RadarMetric {
  label: string
  target: number
  candidate: number
}

interface RadarChartProps {
  metrics: RadarMetric[]
  leftLabel: string
  rightLabel: string
}

function buildPoints(values: number[], radius: number, center: number): string {
  return values
    .map((value, index) => {
      const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2
      const scaledRadius = (Math.max(0, Math.min(100, value)) / 100) * radius
      const x = center + Math.cos(angle) * scaledRadius
      const y = center + Math.sin(angle) * scaledRadius
      return `${x},${y}`
    })
    .join(' ')
}

export function RadarChart({
  metrics,
  leftLabel,
  rightLabel,
}: RadarChartProps) {
  const size = 320
  const center = size / 2
  const radius = 110

  if (!metrics.length) {
    return null
  }

  const targetPolygon = buildPoints(
    metrics.map((metric) => metric.target),
    radius,
    center,
  )
  const candidatePolygon = buildPoints(
    metrics.map((metric) => metric.candidate),
    radius,
    center,
  )

  return (
    <div className="radar-shell">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar chart">
        {[25, 50, 75, 100].map((step) => (
          <polygon
            key={step}
            points={buildPoints(
              metrics.map(() => step),
              radius,
              center,
            )}
            fill="none"
            stroke="rgba(23, 35, 56, 0.12)"
            strokeWidth="1"
          />
        ))}

        {metrics.map((metric, index) => {
          const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2
          const x = center + Math.cos(angle) * radius
          const y = center + Math.sin(angle) * radius
          const labelX = center + Math.cos(angle) * (radius + 22)
          const labelY = center + Math.sin(angle) * (radius + 22)

          return (
            <g key={metric.label}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(23, 35, 56, 0.12)"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor={labelX >= center ? 'start' : 'end'}
                dominantBaseline="central"
                fill="var(--text-muted)"
                fontSize="11"
              >
                {metric.label}
              </text>
            </g>
          )
        })}

        <polygon
          points={targetPolygon}
          fill="rgba(220, 88, 42, 0.22)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <polygon
          points={candidatePolygon}
          fill="rgba(47, 143, 131, 0.18)"
          stroke="var(--secondary)"
          strokeWidth="2"
        />
      </svg>

      <div className="legend">
        <span>
          <i className="target-dot" />
          {leftLabel}
        </span>
        <span>
          <i className="candidate-dot" />
          {rightLabel}
        </span>
      </div>
    </div>
  )
}
