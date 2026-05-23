param(
  [string]$Version = ""
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$packageJson = Get-Content -LiteralPath (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$releaseVersion = if ($Version) { $Version } else { $packageJson.version }
$releaseName = "quipper-study-helper-v$releaseVersion"
$distDir = Join-Path $root "dist"
$stagingDir = Join-Path $distDir $releaseName
$zipPath = Join-Path $distDir "$releaseName.zip"

if (Test-Path -LiteralPath $stagingDir) {
  Remove-Item -LiteralPath $stagingDir -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

$pathsToCopy = @(
  "manifest.json",
  "README.md",
  "src",
  "docs\INSTALL_UNPACKED.md",
  "docs\QA.md"
)

foreach ($relativePath in $pathsToCopy) {
  $source = Join-Path $root $relativePath
  $destination = Join-Path $stagingDir $relativePath

  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing release file: $relativePath"
  }

  $parent = Split-Path -Parent $destination
  if ($parent) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }

  Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

$stagedItems = Get-ChildItem -LiteralPath $stagingDir
Compress-Archive -Path $stagedItems.FullName -DestinationPath $zipPath -Force

Write-Host "Created release ZIP:"
Write-Host $zipPath
