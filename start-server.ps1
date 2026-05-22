$ErrorActionPreference = "Stop"

$node = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$server = Join-Path $PSScriptRoot "server\index.js"
$envFile = Join-Path $PSScriptRoot "server\.env"
$envExample = Join-Path $PSScriptRoot "server\.env.example"

if (-not (Test-Path -LiteralPath $node)) {
  throw "Bundled Node runtime was not found at: $node"
}

if (-not (Test-Path -LiteralPath $server)) {
  throw "Server entry file was not found at: $server"
}

if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $envExample -Destination $envFile
  Write-Host "Created server\.env from server\.env.example"
  Write-Host "Add your OPENAI_API_KEY in server\.env before using AI features."
  Write-Host ""
}

& $node $server
