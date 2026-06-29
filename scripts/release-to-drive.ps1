#!/usr/bin/env pwsh
# Uploads a release's artifacts to the Aikarthya Drive shared drive in the
# structure:
#   APK_Release_Folder/Version{Version}+{Build}/
#       change.log, Release Note.md, Summary.md
#       APK/<apk>, Desktop/<zip>, Web/<zip>
# Prints the APK subfolder link for app_versions.download_url.
#
# Requires PowerShell 7+ (ImportFromPem). Run:
#   pwsh -File scripts/release-to-drive.ps1 -Version 1.0.9 -Build 14 `
#     -KeyFile sa.json -ApkPath app.apk -DesktopZipPath d.zip -WebZipPath w.zip `
#     -ChangelogPath CHANGELOG.md -ReleaseNotePath NOTES.md -SummaryPath SUMMARY.md

[CmdletBinding()]
param(
  [string]$Version,
  [string]$Build,
  [string]$KeyFile,
  [string]$ApkPath,
  [string]$DesktopZipPath,
  [string]$WebZipPath,
  [string]$ChangelogPath,
  [string]$ReleaseNotePath,
  [string]$SummaryPath,
  [string]$RootFolderId = '0AKfyACB4kgZBUk9PVA',
  [switch]$SelfTest
)

$ErrorActionPreference = 'Stop'

function Get-VersionFolderName([string]$v, [string]$b) { "Version$v+$b" }

if ($SelfTest) {
  $name = Get-VersionFolderName '1.0.9' '14'
  if ($name -ne 'Version1.0.9+14') { throw "SelfTest failed: got '$name'" }
  Write-Host 'SelfTest OK'
  return
}

if ($PSVersionTable.PSVersion.Major -lt 7) {
  throw "PowerShell 7+ required (found $($PSVersionTable.PSVersion)). Run with 'pwsh'."
}
foreach ($req in 'Version','Build','KeyFile') {
  if (-not (Get-Variable $req -ValueOnly)) { throw "Missing required -$req" }
}

function ConvertTo-Base64Url([byte[]]$bytes) {
  [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}

function Get-AccessToken([string]$keyFile) {
  $sa = Get-Content $keyFile -Raw | ConvertFrom-Json
  $now = [int][double]::Parse((Get-Date -UFormat %s))
  $enc = [Text.Encoding]::UTF8
  $header = (@{ alg = 'RS256'; typ = 'JWT' } | ConvertTo-Json -Compress)
  $claims = (@{
      iss = $sa.client_email
      scope = 'https://www.googleapis.com/auth/drive'
      aud = 'https://oauth2.googleapis.com/token'
      iat = $now
      exp = $now + 3600
    } | ConvertTo-Json -Compress)
  $signingInput = (ConvertTo-Base64Url $enc.GetBytes($header)) + '.' +
                  (ConvertTo-Base64Url $enc.GetBytes($claims))
  $rsa = [System.Security.Cryptography.RSA]::Create()
  $rsa.ImportFromPem($sa.private_key)
  $sig = $rsa.SignData(
    $enc.GetBytes($signingInput),
    [Security.Cryptography.HashAlgorithmName]::SHA256,
    [Security.Cryptography.RSASignaturePadding]::Pkcs1)
  $jwt = "$signingInput." + (ConvertTo-Base64Url $sig)
  $resp = Invoke-RestMethod -Method Post -Uri 'https://oauth2.googleapis.com/token' `
    -ContentType 'application/x-www-form-urlencoded' `
    -Body @{ grant_type = 'urn:ietf:params:oauth:grant-type:jwt-bearer'; assertion = $jwt }
  return $resp.access_token
}

function Ensure-Folder([string]$name, [string]$parentId, [string]$token) {
  $escaped = $name.Replace("'", "\'")
  $q = "name='$escaped' and '$parentId' in parents and " +
       "mimeType='application/vnd.google-apps.folder' and trashed=false"
  $listUri = 'https://www.googleapis.com/drive/v3/files?q=' +
    [uri]::EscapeDataString($q) +
    "&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=$RootFolderId&fields=files(id,name)"
  $list = Invoke-RestMethod -Uri $listUri -Headers @{ Authorization = "Bearer $token" }
  if ($list.files -and $list.files.Count -gt 0) { return $list.files[0].id }
  $body = @{ name = $name; mimeType = 'application/vnd.google-apps.folder'; parents = @($parentId) } | ConvertTo-Json
  $created = Invoke-RestMethod -Method Post `
    -Uri 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true' `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body
  return $created.id
}

function Set-AnyoneReader([string]$id, [string]$token) {
  $body = @{ role = 'reader'; type = 'anyone' } | ConvertTo-Json
  Invoke-RestMethod -Method Post `
    -Uri "https://www.googleapis.com/drive/v3/files/$id/permissions?supportsAllDrives=true" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body | Out-Null
}

function Upload-File([string]$path, [string]$parentId, [string]$token, [string]$name) {
  if (-not $name) { $name = Split-Path $path -Leaf }
  $meta = @{ name = $name; parents = @($parentId) } | ConvertTo-Json
  $file = Invoke-RestMethod -Method Post `
    -Uri 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id' `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $meta
  $result = Invoke-RestMethod -Method Patch `
    -Uri "https://www.googleapis.com/upload/drive/v3/files/$($file.id)?uploadType=media&supportsAllDrives=true&fields=id,webViewLink" `
    -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/octet-stream' -InFile $path
  Set-AnyoneReader $result.id $token
  return $result
}

$token = Get-AccessToken $KeyFile
$rootApk = Ensure-Folder 'APK_Release_Folder' $RootFolderId $token
Set-AnyoneReader $rootApk $token
$verName = Get-VersionFolderName $Version $Build
$verFolder = Ensure-Folder $verName $rootApk $token
Set-AnyoneReader $verFolder $token

# Docs at version-folder root (renamed to the canonical names)
if ($ChangelogPath)   { Upload-File $ChangelogPath   $verFolder $token 'change.log'      | Out-Null }
if ($ReleaseNotePath) { Upload-File $ReleaseNotePath $verFolder $token 'Release Note.md' | Out-Null }
if ($SummaryPath)     { Upload-File $SummaryPath     $verFolder $token 'Summary.md'      | Out-Null }

# Artifact subfolders
$apkFolder = Ensure-Folder 'APK' $verFolder $token
Set-AnyoneReader $apkFolder $token
if ($ApkPath) { Upload-File $ApkPath $apkFolder $token | Out-Null }

if ($DesktopZipPath) {
  $d = Ensure-Folder 'Desktop' $verFolder $token
  Set-AnyoneReader $d $token
  Upload-File $DesktopZipPath $d $token | Out-Null
}
if ($WebZipPath) {
  $w = Ensure-Folder 'Web' $verFolder $token
  Set-AnyoneReader $w $token
  Upload-File $WebZipPath $w $token | Out-Null
}

$link = "https://drive.google.com/drive/folders/$apkFolder"
Write-Host "Release '$verName' uploaded."
Write-Host "APK_FOLDER_LINK=$link"
