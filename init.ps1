# init.ps1 - Windows verification entrypoint for this prototype.
#
# Runs the same real checks as ./init.sh. Fails fast on any failure.

$ErrorActionPreference = 'Stop'

Write-Host '=== Harness Initialization ==='

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'node is not on PATH; this prototype needs Node 18 or newer for verification.'
}

& node verify.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Prototype verification failed with exit code $LASTEXITCODE"
}

Write-Host '=== Verification Complete ==='
Write-Host ''
Write-Host 'Next steps:'
Write-Host '1. Read feature_list.json to see current feature state'
Write-Host '2. Pick ONE unfinished feature to work on'
Write-Host '3. Re-run verification before claiming done'
