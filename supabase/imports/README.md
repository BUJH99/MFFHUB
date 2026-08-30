# Normalized appearance catalog import

The four normalized CSV files are one authoritative catalog snapshot:

1. `character_appearances.csv`
2. `appearance_abilities.csv`
3. `appearance_ability_effects.csv`
4. `appearance_ability_coverage.csv`

Apply `supabase/migrations/202608300001_normalize_appearance_abilities.sql`
first. Then generate a fresh snapshot with the THANO$VIB$ sync and run the
import from the repository root:

```powershell
$env:DATABASE_URL = 'postgresql://...'
.\scripts\import-appearance-catalog.ps1
```

The default run is non-destructive: it loads all four files into temporary
typed tables, validates character/appearance/ability foreign keys and the
three coverage states, then upserts parent-to-child in one transaction. The
preflight also requires at least 882 appearances, rejects every
`missing`/`needs_review` status, and accepts `not_applicable` only for a default
appearance's `uniform_effect`; every other coverage row must be `complete`. A
transaction advisory lock prevents two catalog imports from racing. Any COPY,
validation, or upsert failure rolls back the full run.

After reviewing the generated row counts and confirming the files are a full
snapshot, stale rows can be removed explicitly:

```powershell
.\scripts\import-appearance-catalog.ps1 -PruneStale
```

Pruning deletes effects, abilities, coverage, and appearances in child-first
order. It refuses a suspicious snapshot below 80% of the existing appearance
count or 50% of the existing ability count. Do not enable pruning for a
filtered or manually edited subset.

The wrapper stops before launching `psql` when `DATABASE_URL`, `psql`, or any
required CSV file is missing. The database URL is never printed. For CI/Linux,
the equivalent direct command from the repository root is:

```sh
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v prune_stale=false \
  -f supabase/imports/import_appearance_catalog.psql
```

Use an owner/service connection for ingestion. `anon` and `authenticated`
roles only have SELECT access to these catalog tables. Local CSV files cannot
be read directly by the hosted SQL Editor, so the checked-in psql flow is the
reproducible import path; the migration itself remains safe to run in the SQL
Editor.
