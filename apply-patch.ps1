param(
  [string]$ProjectPath = "C:\Projects\ULTD-TRANS-PRO"
)
$ErrorActionPreference = "Stop"
$SourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath "prisma\schema.prisma"))) {
  throw "Could not find prisma\schema.prisma under $ProjectPath. Pass the correct -ProjectPath."
}

$relativeFiles = @(
  "app\api\approvals\[id]\route.ts",
  "app\approvals\page.tsx",
  "components\ApprovalActions.tsx",
  "lib\email\approval-payload.ts",
  "providers\email\resend.ts"
)
foreach ($relative in $relativeFiles) {
  $source = Join-Path $SourceRoot $relative
  $target = Join-Path $ProjectPath $relative
  if (-not (Test-Path -LiteralPath $source)) { throw "Patch file missing: $source" }
  $targetFolder = Split-Path -Parent $target
  New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
  if (Test-Path -LiteralPath $target) {
    Copy-Item -LiteralPath $target -Destination "$target.bak-$(Get-Date -Format yyyyMMddHHmmss)" -Force
  }
  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host "Updated $relative" -ForegroundColor Green
}

$schemaPath = Join-Path $ProjectPath "prisma\schema.prisma"
$schema = [System.IO.File]::ReadAllText($schemaPath)
$enumPattern = '(?s)enum\s+ApprovalStatus\s*\{[^}]*\}'
$enumMatch = [regex]::Match($schema, $enumPattern)
if (-not $enumMatch.Success) { throw "Could not find enum ApprovalStatus in prisma/schema.prisma. No enum change was made." }
$enumBlock = @'
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  SENDING
  SENT
  SEND_FAILED
}
'@
$enumBlock = $enumBlock.Trim()
$schemaBackup = "$schemaPath.bak-$(Get-Date -Format yyyyMMddHHmmss)"
Copy-Item -LiteralPath $schemaPath -Destination $schemaBackup -Force
$schema = [regex]::Replace($schema, $enumPattern, $enumBlock, 1)
[System.IO.File]::WriteAllText($schemaPath, $schema, [System.Text.UTF8Encoding]::new($false))
Write-Host "Updated ApprovalStatus enum (backup: $schemaBackup)" -ForegroundColor Green

$cssPath = Join-Path $ProjectPath "app\globals.css"
$css = [System.IO.File]::ReadAllText($cssPath)
$marker = "/* ULTD TRANS PRO v0.6.3 email approval styles */"
if (-not $css.Contains($marker)) {
  $cssBackup = "$cssPath.bak-$(Get-Date -Format yyyyMMddHHmmss)"
  Copy-Item -LiteralPath $cssPath -Destination $cssBackup -Force
  $newStyles = [System.IO.File]::ReadAllText((Join-Path $SourceRoot "styles.patch.css"))
  [System.IO.File]::AppendAllText($cssPath, [Environment]::NewLine + [Environment]::NewLine + $newStyles + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Appended approval UI styles (backup: $cssBackup)" -ForegroundColor Green
} else {
  Write-Host "Approval styles already exist; skipping duplicate CSS." -ForegroundColor Yellow
}

Write-Host "Patch files installed. Your .env has not been changed." -ForegroundColor Cyan
Write-Host "Next: add EMAIL_* values to the existing .env, then run Prisma migration/generate." -ForegroundColor Cyan
