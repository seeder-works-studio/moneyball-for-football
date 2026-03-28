# Moneyball for Football Frontend

Static Vite + React app for exploring player replacement recommendations from the prepared football datasets in the parent repository.

## What it does

- Bundles outfield and goalkeeper data into a static JSON file
- Computes role-based player similarity fully in the browser
- Lets you filter by minutes, age, and squad exclusions
- Visualizes shortlist results and percentile-style comparisons

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The build automatically regenerates `public/data/scouting-data.json` from the source CSVs in the parent repository before compiling.

## Repo split

If you want to push this as its own deployable repository, copy the entire `frontend/` folder into a new git repo. The generated data file is already bundled inside `public/data/`.

If you still want to regenerate data after moving it, either:

1. Keep the same parent-relative dataset paths.
2. Update `scripts/build-dataset.mjs` so it points at wherever you store the CSVs in the new repo.

# moneyball-for-football
