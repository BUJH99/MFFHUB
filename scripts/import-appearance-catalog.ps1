[CmdletBinding()]
param(
  [switch]$PruneStale
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw 'DATABASE_URL is not set. No database changes were made.'
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$importScript = Join-Path $repositoryRoot 'supabase\imports\import_appearance_catalog.psql'
$requiredCsvFiles = @(
  'character_appearances.csv',
  'appearance_abilities.csv',
  'appearance_ability_effects.csv',
  'appearance_ability_coverage.csv'
)

foreach ($fileName in $requiredCsvFiles) {
  $filePath = Join-Path $repositoryRoot "supabase\imports\$fileName"
  if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
    throw "Required catalog snapshot is missing: $filePath"
  }
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if ($null -eq $psql) {
  throw 'psql was not found in PATH. No database changes were made.'
}

$pruneValue = if ($PruneStale) { 'true' } else { 'false' }
Push-Location $repositoryRoot
try {
  & $psql.Source `
    --no-psqlrc `
    --set ON_ERROR_STOP=1 `
    --set "prune_stale=$pruneValue" `
    --dbname $env:DATABASE_URL `
    --file $importScript
  if ($LASTEXITCODE -ne 0) {
    throw "Appearance catalog import failed with psql exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}
