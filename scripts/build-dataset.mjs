import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(process.cwd(), '..')
const appDir = process.cwd()

const outfieldSource = path.join(
  rootDir,
  "Players' Replacement",
  'final_players_2024.csv',
)
const goalkeeperSource = path.join(
  rootDir,
  "Players' Replacement",
  'Goalkeepers',
  'final_gk.csv',
)
const outputPath = path.join(appDir, 'public', 'data', 'scouting-data.json')

const METRIC_DEFINITIONS = {
  Goals_per90: { label: 'Goals / 90', format: 'number' },
  'G+A_per90': { label: 'Goals + assists / 90', format: 'number' },
  xG_per90: { label: 'xG / 90', format: 'number' },
  'xG+xAG_per90': { label: 'xG + xAG / 90', format: 'number' },
  npxG_per90: { label: 'Non-penalty xG / 90', format: 'number' },
  Assists_per_90: { label: 'Assists / 90', format: 'number' },
  xAG_per_90: { label: 'xAG / 90', format: 'number' },
  Touches_Def_3rd_per_90: { label: 'Touches in defensive third / 90', format: 'number' },
  Touches_Mid_3rd_per_90: { label: 'Touches in middle third / 90', format: 'number' },
  Touches_Att_3rd_per_90: { label: 'Touches in attacking third / 90', format: 'number' },
  Touches_Att_Pen_per_90: { label: 'Touches in penalty area / 90', format: 'number' },
  Touches_per_90: { label: 'Touches / 90', format: 'number' },
  Carries_per_90: { label: 'Carries / 90', format: 'number' },
  Progressive_Distance_Carried_per_90: {
    label: 'Progressive carry distance / 90',
    format: 'number',
  },
  Progressive_Carries_per_90: { label: 'Progressive carries / 90', format: 'number' },
  Passes_Received_per_90: { label: 'Passes received / 90', format: 'number' },
  Progressive_Passes_Received_per_90: {
    label: 'Progressive passes received / 90',
    format: 'number',
  },
  Take_Ons_Attempted_per_90: { label: 'Take-ons attempted / 90', format: 'number' },
  Take_Ons_Succ_per_90: { label: 'Successful take-ons / 90', format: 'number' },
  Shot_Creating_Action_per90: { label: 'Shot-creating actions / 90', format: 'number' },
  Goal_Creating_Action_90: { label: 'Goal-creating actions / 90', format: 'number' },
  Passes_Total_Cmp: { label: 'Completed passes', format: 'integer' },
  'Passes_Total_Cmp%': { label: 'Pass completion', format: 'percent' },
  Passes_PrgDist: { label: 'Progressive pass distance', format: 'number' },
  'Passes_1/3_per_90': { label: 'Final-third passes / 90', format: 'number' },
  Passes_Penalty_Area_per_90: { label: 'Passes into penalty area / 90', format: 'number' },
  Progressive_Passes_per_90: { label: 'Progressive passes / 90', format: 'number' },
  Key_Passes_per_90: { label: 'Key passes / 90', format: 'number' },
  'Passes_Long_Cmp%': { label: 'Long-pass completion', format: 'percent' },
  Ball_Recoveries_per_90: { label: 'Ball recoveries / 90', format: 'number' },
  Interceptions_per_90: { label: 'Interceptions / 90', format: 'number' },
  Tackles_Won_per_90: { label: 'Tackles won / 90', format: 'number' },
  'Tackles+Interceptions_per_90': {
    label: 'Tackles + interceptions / 90',
    format: 'number',
  },
  'Dribblers_Tackle_W%': { label: 'Dribbler tackle win rate', format: 'percent' },
  Blocks_per_90: { label: 'Blocks / 90', format: 'number' },
  Clearances_per_90: { label: 'Clearances / 90', format: 'number' },
  Aerials_Won_per_90: { label: 'Aerials won / 90', format: 'number' },
  Percentage_of_Aerials_Won: { label: 'Aerial duel win rate', format: 'percent' },
  Shots_total_per90: { label: 'Shots / 90', format: 'number' },
  Shots_on_target_per90: { label: 'Shots on target / 90', format: 'number' },
  Goals_per_shot: { label: 'Goals per shot', format: 'number' },
  Npxg_per_shot: { label: 'Non-penalty xG per shot', format: 'number' },
  Fouls_Drawn_per_90: { label: 'Fouls drawn / 90', format: 'number' },
  Crosses_per_90: { label: 'Crosses / 90', format: 'number' },
  'Save%': { label: 'Save percentage', format: 'percent' },
  Gk_psxg_diff: { label: 'Post-shot xG differential', format: 'number' },
  Gk_def_actions_outside_pen_area: {
    label: 'Defensive actions outside box',
    format: 'number',
  },
  Gk_avg_distance_def_actions: {
    label: 'Average distance of defensive actions',
    format: 'number',
  },
  Gk_passes_pct_launched: { label: 'Launched pass share', format: 'percent' },
  Gk_passes: { label: 'Goalkeeper passes', format: 'integer' },
  'Passes_1/3': { label: 'Passes into final third', format: 'integer' },
  Goal_Creating_Action_per90: { label: 'Goal-creating actions / 90', format: 'number' },
  Goals_Against_per90: { label: 'Goals against / 90', format: 'number' },
  Saves: { label: 'Saves', format: 'integer' },
  'CS%': { label: 'Clean sheet rate', format: 'percent' },
  Gk_crosses_stopped: { label: 'Crosses stopped', format: 'integer' },
  Gk_crosses_stopped_pct: { label: 'Cross-stopping rate', format: 'percent' },
  Gk_def_actions_outside_pen_area_per90: {
    label: 'Defensive actions outside box / 90',
    format: 'number',
  },
}

const OUTFIELD_METRICS = [
  'Goals_per90',
  'G+A_per90',
  'xG_per90',
  'xG+xAG_per90',
  'npxG_per90',
  'Assists_per_90',
  'xAG_per_90',
  'Touches_Def_3rd_per_90',
  'Touches_Mid_3rd_per_90',
  'Touches_Att_3rd_per_90',
  'Touches_Att_Pen_per_90',
  'Touches_per_90',
  'Carries_per_90',
  'Progressive_Distance_Carried_per_90',
  'Progressive_Carries_per_90',
  'Passes_Received_per_90',
  'Progressive_Passes_Received_per_90',
  'Take_Ons_Attempted_per_90',
  'Take_Ons_Succ_per_90',
  'Shot_Creating_Action_per90',
  'Goal_Creating_Action_90',
  'Passes_Total_Cmp',
  'Passes_Total_Cmp%',
  'Passes_PrgDist',
  'Passes_1/3_per_90',
  'Passes_Penalty_Area_per_90',
  'Progressive_Passes_per_90',
  'Key_Passes_per_90',
  'Passes_Long_Cmp%',
  'Ball_Recoveries_per_90',
  'Interceptions_per_90',
  'Tackles_Won_per_90',
  'Tackles+Interceptions_per_90',
  'Dribblers_Tackle_W%',
  'Blocks_per_90',
  'Clearances_per_90',
  'Aerials_Won_per_90',
  'Percentage_of_Aerials_Won',
  'Shots_total_per90',
  'Shots_on_target_per90',
  'Goals_per_shot',
  'Npxg_per_shot',
  'Fouls_Drawn_per_90',
  'Crosses_per_90',
]

const GOALKEEPER_METRICS = [
  'Goals_Against_per90',
  'Save%',
  'Saves',
  'CS%',
  'Gk_psxg_diff',
  'Gk_crosses_stopped',
  'Gk_crosses_stopped_pct',
  'Gk_def_actions_outside_pen_area',
  'Gk_def_actions_outside_pen_area_per90',
  'Gk_avg_distance_def_actions',
  'Passes_Total_Cmp%',
  'Passes_Long_Cmp%',
  'Gk_passes_pct_launched',
  'Gk_passes',
  'Passes_1/3',
  'Goal_Creating_Action_per90',
]

function parseCsv(filePath) {
  const source = fs.readFileSync(filePath, 'utf8').trim()
  const [headerLine, ...lines] = source.split(/\r?\n/)
  const headers = splitCsvLine(headerLine)

  return lines.map((line) => {
    const values = splitCsvLine(line)
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? ''
      return record
    }, {})
  })
}

function splitCsvLine(line) {
  const values = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (character === ',' && !insideQuotes) {
      values.push(current)
      current = ''
    } else {
      current += character
    }
  }

  values.push(current)
  return values
}

function numericValue(raw) {
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

function buildMetricMap(record, metricKeys) {
  return metricKeys.reduce((metrics, metricKey) => {
    metrics[metricKey] = numericValue(record[metricKey])
    return metrics
  }, {})
}

function buildOutfieldPlayer(record, index) {
  return {
    id: `outfield-${index + 1}`,
    dataset: 'outfield',
    player: record.Player,
    nation: record.Nation,
    pos: record.Pos,
    squad: record.Squad,
    comp: record.Comp,
    age: numericValue(record.Age),
    minutes: numericValue(record.Min),
    starts: numericValue(record.Starts),
    seasonsTop5: numericValue(record['Seasons at top 5']),
    metrics: buildMetricMap(record, OUTFIELD_METRICS),
  }
}

function buildGoalkeeperPlayer(record, index) {
  return {
    id: `goalkeeper-${index + 1}`,
    dataset: 'goalkeeper',
    player: record.Player,
    nation: record.Nation,
    pos: record.Pos,
    squad: record.Squad,
    comp: record.Comp,
    age: numericValue(record.Age),
    minutes: numericValue(record.Min),
    starts: numericValue(record.Starts),
    seasonsTop5: numericValue(record['Seasons at top 5']),
    metrics: buildMetricMap(record, GOALKEEPER_METRICS),
  }
}

function metricDefinitions(keys) {
  return keys.reduce((definitions, key) => {
    definitions[key] = {
      key,
      label: METRIC_DEFINITIONS[key]?.label ?? key,
      format: METRIC_DEFINITIONS[key]?.format ?? 'number',
    }
    return definitions
  }, {})
}

const outfieldPlayers = parseCsv(outfieldSource)
  .map(buildOutfieldPlayer)
  .filter((player) => player.player && player.pos !== 'GK')

const goalkeeperPlayers = parseCsv(goalkeeperSource)
  .map(buildGoalkeeperPlayer)
  .filter((player) => player.player)

const output = {
  meta: {
    generatedAt: new Date().toISOString(),
    sourceModel: 'Static export from notebook-prepared 2021-2024 aggregate datasets',
    totalPlayers: outfieldPlayers.length + goalkeeperPlayers.length,
  },
  datasets: {
    outfield: {
      key: 'outfield',
      label: 'Outfield players',
      metricDefinitions: metricDefinitions(OUTFIELD_METRICS),
      players: outfieldPlayers,
    },
    goalkeeper: {
      key: 'goalkeeper',
      label: 'Goalkeepers',
      metricDefinitions: metricDefinitions(GOALKEEPER_METRICS),
      players: goalkeeperPlayers,
    },
  },
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote ${outputPath}`)
