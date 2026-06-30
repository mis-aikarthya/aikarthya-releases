# Night Shift - Codex local environment setup (Windows / PowerShell)
#
# Prepares this machine for the Night Shift Automation worker:
#   verifies Flutter + Chrome, enables Flutter web, fetches app deps,
#   and checks for the git-ignored staging mgmt test-login file.
# Ponytail is already installed - nothing to do for it here.
#
# Run:  powershell -ExecutionPolicy Bypass -File NIGHT_SHIFT_CODEX_SETUP.ps1

$ErrorActionPreference = 'Stop'

$RepoRoot = if ($PSScriptRoot) { $PSScriptRoot } else { 'C:\Users\KIIT0001\Desktop\Aikarthya-field-ops' }
$AppDir   = Join-Path $RepoRoot 'aikarthya-field-ops-app'

Write-Host "== Night Shift env setup =="
Write-Host "Repo root: $RepoRoot"

# 1. Flutter present?
$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutter) {
  throw "Flutter not on PATH for this shell. You run 'flutter run' locally, so this usually just means PATH isn't set for this session - reopen the shell or add Flutter's bin to PATH."
}
Write-Host "Flutter: $($flutter.Source)"
flutter --version
if ($LASTEXITCODE -ne 0) { throw "flutter --version failed (exit $LASTEXITCODE)" }

# 2. Web enabled (idempotent)
flutter config --enable-web | Out-Null

# 3. Chrome present? 'flutter run -d chrome' needs it.
$chrome = $env:CHROME_EXECUTABLE
if (-not $chrome -or -not (Test-Path $chrome)) {
  $candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
  )
  $chrome = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if ($chrome) {
  Write-Host "Chrome: $chrome"
  Write-Host "  If flutter can't find it, set: `$env:CHROME_EXECUTABLE = '$chrome'"
} else {
  Write-Warning "Chrome not found in standard locations. Install Google Chrome or set CHROME_EXECUTABLE, or the worker's 'flutter run -d chrome' visual check will fail."
}

# 4. App deps
if (-not (Test-Path $AppDir)) { throw "App dir not found: $AppDir" }
Write-Host "Running flutter pub get in $AppDir ..."
Push-Location $AppDir
try {
  flutter pub get
  if ($LASTEXITCODE -ne 0) { throw "flutter pub get failed (exit $LASTEXITCODE)" }
} finally {
  Pop-Location
}

# 5. Staging mgmt test login present? (worker logs in for the visual check)
$secrets = @(
  (Join-Path $RepoRoot 'NIGHT_SHIFT_SECRETS'),
  (Join-Path $AppDir '.env.local')
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($secrets) {
  Write-Host "Test login file: $secrets"
} else {
  Write-Warning "No NIGHT_SHIFT_SECRETS or .env.local found. The worker can build/verify but will SKIP the live dashboard login until you add a staging mgmt test login there (git-ignored, never committed)."
}

Write-Host ""
Write-Host "Environment ready. Ponytail already installed - no action needed."
