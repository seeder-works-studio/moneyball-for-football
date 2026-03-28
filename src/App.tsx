import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { MetricComparison } from './components/MetricComparison'
import { RadarChart } from './components/RadarChart'
import {
  formatAge,
  formatCompactNumber,
  formatLeagueName,
  formatMetricValue,
  formatPosition,
} from './lib/format'
import {
  analyzeTarget,
  getDefaultPlayerId,
  getEligiblePlayers,
  getPresetById,
  getPresetsForDataset,
  getSearchFilteredPlayers,
} from './lib/analysis'
import type {
  DatasetKey,
  PlayerRecord,
  RolePreset,
  ScoutingData,
} from './types'

function App() {
  const [data, setData] = useState<ScoutingData | null>(null)
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('outfield')
  const [presetId, setPresetId] = useState<string>('')
  const [playerSearch, setPlayerSearch] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [minMinutes, setMinMinutes] = useState(2400)
  const [maxAge, setMaxAge] = useState(29)
  const [excludeSameSquad, setExcludeSameSquad] = useState(true)
  const [onlyTopFiveVeterans, setOnlyTopFiveVeterans] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/data/scouting-data.json')

        if (!response.ok) {
          throw new Error(`Failed to load bundled data (${response.status})`)
        }

        const nextData = (await response.json()) as ScoutingData

        if (cancelled) {
          return
        }

        setData(nextData)
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : 'Unknown error while loading scouting data.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const dataset = data?.datasets[datasetKey] ?? null
  const presets = useMemo(() => getPresetsForDataset(datasetKey), [datasetKey])

  useEffect(() => {
    if (!presets.length) {
      return
    }

    if (!presets.some((preset) => preset.id === presetId)) {
      setPresetId(presets[0].id)
    }
  }, [presetId, presets])

  const activePreset = useMemo<RolePreset | null>(() => {
    if (!presetId) {
      return presets[0] ?? null
    }

    return getPresetById(datasetKey, presetId) ?? presets[0] ?? null
  }, [datasetKey, presetId, presets])

  const eligiblePlayers = useMemo<PlayerRecord[]>(() => {
    if (!dataset || !activePreset) {
      return []
    }

    return getEligiblePlayers(dataset.players, activePreset)
  }, [activePreset, dataset])

  useEffect(() => {
    if (!eligiblePlayers.length || !activePreset) {
      return
    }

    const currentExists = eligiblePlayers.some(
      (player) => player.id === selectedPlayerId,
    )

    if (currentExists) {
      return
    }

    const nextDefaultId =
      getDefaultPlayerId(datasetKey, activePreset.id, eligiblePlayers) ??
      eligiblePlayers[0]?.id ??
      ''

    setSelectedPlayerId(nextDefaultId)
  }, [activePreset, datasetKey, eligiblePlayers, selectedPlayerId])

  const visiblePlayers = useMemo(() => {
    return getSearchFilteredPlayers(eligiblePlayers, playerSearch)
  }, [eligiblePlayers, playerSearch])

  const selectedPlayer = useMemo(() => {
    return eligiblePlayers.find((player) => player.id === selectedPlayerId) ?? null
  }, [eligiblePlayers, selectedPlayerId])

  const analysis = useMemo(() => {
    if (!selectedPlayer || !activePreset) {
      return null
    }

    return analyzeTarget({
      players: eligiblePlayers,
      target: selectedPlayer,
      preset: activePreset,
      filters: {
        minMinutes,
        maxAge,
        excludeSameSquad,
        onlyTopFiveVeterans,
      },
    })
  }, [
    activePreset,
    eligiblePlayers,
    excludeSameSquad,
    maxAge,
    minMinutes,
    onlyTopFiveVeterans,
    selectedPlayer,
  ])

  const topCandidate = analysis?.recommendations[0] ?? null

  const displaySpotlightMetrics = useMemo(() => {
    if (!analysis || !dataset) {
      return []
    }

    return analysis.spotlightMetrics.map((metric) => ({
      ...metric,
      label: dataset.metricDefinitions[metric.key]?.label ?? metric.key,
      format: dataset.metricDefinitions[metric.key]?.format ?? metric.format,
    }))
  }, [analysis, dataset])

  const radarMetrics = useMemo(() => {
    if (!displaySpotlightMetrics.length || !topCandidate) {
      return []
    }

    return displaySpotlightMetrics.slice(0, 6).map((metric) => ({
      label: metric.label,
      target: metric.targetPercentile,
      candidate: metric.candidatePercentile,
    }))
  }, [displaySpotlightMetrics, topCandidate])

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Data-driven football recruitment</p>
          <h1>Moneyball for Football</h1>
          <p className="hero-text">
            Scout talent, compare player profiles, and rank replacement options
            across the top European leagues using a unified performance model.
          </p>
        </div>

        <div className="hero-stats" aria-label="Application coverage">
          <div className="stat-card">
            <span className="stat-value">
              {formatCompactNumber(data?.meta.totalPlayers ?? 0)}
            </span>
            <span className="stat-label">Bundled players</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">2021-2024</span>
            <span className="stat-label">Aggregate data model</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {datasetKey === 'outfield' ? 'Outfield' : 'Goalkeepers'}
            </span>
            <span className="stat-label">Active cohort</span>
          </div>
        </div>
      </section>

      <section className="layout-grid">
        <aside className="control-panel">
          <div className="panel-header">
            <p className="eyebrow">Controls</p>
            <h2>Find a replacement</h2>
          </div>

          <div className="control-stack">
            <label className="field">
              <span>Dataset</span>
              <div className="segmented-control">
                <button
                  type="button"
                  className={datasetKey === 'outfield' ? 'active' : ''}
                  onClick={() => setDatasetKey('outfield')}
                >
                  Outfield
                </button>
                <button
                  type="button"
                  className={datasetKey === 'goalkeeper' ? 'active' : ''}
                  onClick={() => setDatasetKey('goalkeeper')}
                >
                  Goalkeepers
                </button>
              </div>
            </label>

            <label className="field">
              <span>Role preset</span>
              <select
                value={activePreset?.id ?? ''}
                onChange={(event) => setPresetId(event.target.value)}
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              {activePreset ? (
                <small className="field-note">{activePreset.description}</small>
              ) : null}
            </label>

            <label className="field">
              <span>Search players</span>
              <input
                type="search"
                value={playerSearch}
                placeholder="Rodri, Salah, Alisson..."
                onChange={(event) => setPlayerSearch(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Choose target player</span>
              <select
                value={selectedPlayer?.id ?? ''}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
              >
                {visiblePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.player} · {player.squad}
                  </option>
                ))}
              </select>
              <small className="field-note">
                {visiblePlayers.length} players match the current preset and search.
              </small>
            </label>

            <label className="field">
              <span>Minimum minutes: {minMinutes.toLocaleString()}</span>
              <input
                type="range"
                min={900}
                max={9000}
                step={300}
                value={minMinutes}
                onChange={(event) => setMinMinutes(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Maximum age: {maxAge}</span>
              <input
                type="range"
                min={19}
                max={36}
                step={1}
                value={maxAge}
                onChange={(event) => setMaxAge(Number(event.target.value))}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={excludeSameSquad}
                onChange={(event) => setExcludeSameSquad(event.target.checked)}
              />
              <span>Exclude players from the same squad</span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={onlyTopFiveVeterans}
                onChange={(event) => setOnlyTopFiveVeterans(event.target.checked)}
              />
              <span>Require at least 2 seasons in the top 5 leagues</span>
            </label>
          </div>
        </aside>

        <section className="results-panel">
          {loading ? (
            <div className="empty-state">
              <h2>Loading bundled scouting data</h2>
              <p>The app is fetching the static JSON bundle shipped with the frontend.</p>
            </div>
          ) : error ? (
            <div className="empty-state error-state">
              <h2>Could not load the app data</h2>
              <p>{error}</p>
            </div>
          ) : !selectedPlayer || !activePreset || !dataset ? (
            <div className="empty-state">
              <h2>No valid target is selected</h2>
              <p>Pick a dataset and a role preset to start exploring replacements.</p>
            </div>
          ) : !analysis ? (
            <div className="empty-state">
              <h2>Analysis unavailable</h2>
              <p>The current combination of filters did not produce a valid comparison pool.</p>
            </div>
          ) : (
            <>
              <section className="section-card profile-grid">
                <div className="profile-card">
                  <p className="eyebrow">Target</p>
                  <h2>{selectedPlayer.player}</h2>
                  <p className="profile-meta">
                    {formatPosition(selectedPlayer.pos)} · {selectedPlayer.squad}
                  </p>
                  <p className="profile-meta">
                    {formatLeagueName(selectedPlayer.comp)} · {formatAge(selectedPlayer.age)} ·{' '}
                    {selectedPlayer.minutes.toLocaleString()} minutes
                  </p>
                  <div className="tag-row">
                    <span>{activePreset.label}</span>
                    <span>{selectedPlayer.seasonsTop5} seasons in top 5</span>
                  </div>
                </div>

                <div className="profile-card emphasis-card">
                  <p className="eyebrow">Top recommendation</p>
                  {topCandidate ? (
                    <>
                      <h2>{topCandidate.player.player}</h2>
                      <p className="profile-meta">
                        {formatPosition(topCandidate.player.pos)} ·{' '}
                        {topCandidate.player.squad}
                      </p>
                      <p className="profile-meta">
                        Similarity score {topCandidate.similarity.toFixed(1)} / 100
                      </p>
                      <div className="tag-row">
                        <span>{formatAge(topCandidate.player.age)}</span>
                        <span>{topCandidate.player.minutes.toLocaleString()} minutes</span>
                      </div>
                    </>
                  ) : (
                    <p>No candidate matched the current filters.</p>
                  )}
                </div>

                <div className="profile-card">
                  <p className="eyebrow">Pool diagnostics</p>
                  <h2>{analysis.poolSize}</h2>
                  <p className="profile-meta">eligible comparison players</p>
                  <ul className="diagnostic-list">
                    <li>{analysis.removedPlayers} players removed by filters</li>
                    <li>{activePreset.metrics.length} metrics used for similarity</li>
                    <li>Role-specific model tuned to the active scouting profile</li>
                  </ul>
                </div>
              </section>

              <section className="section-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Recommendations</p>
                    <h2>Shortlist</h2>
                  </div>
                  <p className="section-note">
                    Cosine similarity after z-score scaling, scoped to the active role
                    preset.
                  </p>
                </div>

                <div className="table-wrap">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Club</th>
                        <th>Age</th>
                        <th>Minutes</th>
                        <th>League</th>
                        <th>Similarity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.recommendations.slice(0, 10).map((candidate) => (
                        <tr key={candidate.player.id}>
                          <td>{candidate.player.player}</td>
                          <td>{candidate.player.squad}</td>
                          <td>{candidate.player.age}</td>
                          <td>{candidate.player.minutes.toLocaleString()}</td>
                          <td>{formatLeagueName(candidate.player.comp)}</td>
                          <td>{candidate.similarity.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {topCandidate ? (
                <section className="section-card dual-pane">
                  <div>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">Percentile shape</p>
                        <h2>Target vs top candidate</h2>
                      </div>
                    </div>

                    <RadarChart
                      metrics={radarMetrics}
                      leftLabel={selectedPlayer.player}
                      rightLabel={topCandidate.player.player}
                    />
                  </div>

                  <div>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">Spotlight metrics</p>
                        <h2>Why the fit works</h2>
                      </div>
                    </div>

                    <MetricComparison
                      metrics={displaySpotlightMetrics}
                      targetLabel={selectedPlayer.player}
                      candidateLabel={topCandidate.player.player}
                    />
                  </div>
                </section>
              ) : null}

              <section className="section-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Metric model</p>
                    <h2>{activePreset.label}</h2>
                  </div>
                </div>

                <div className="preset-grid">
                  {activePreset.metrics.map((metricKey) => {
                    const definition = dataset.metricDefinitions[metricKey]

                    return (
                      <div key={metricKey} className="preset-metric-card">
                        <span className="metric-label">{definition.label}</span>
                        <strong>
                          {formatMetricValue(
                            selectedPlayer.metrics[metricKey] ?? 0,
                            definition.format,
                          )}
                        </strong>
                        <small>
                          Target value for {selectedPlayer.player}
                        </small>
                      </div>
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
