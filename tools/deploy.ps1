param(
    [string]$Destination = 'W:\public_html\gameDialogueMaker'
)

$ErrorActionPreference = 'Stop'
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$targetRoot = [IO.Path]::GetFullPath($Destination).TrimEnd('\')
if (-not (Test-Path -LiteralPath $targetRoot -PathType Container)) {
    throw "Deployment directory does not exist: $targetRoot"
}

# Deploy browser assets only. Engine template sources are already bundled in js/.
$modified = @(& git -C $sourceRoot diff HEAD --name-only --diff-filter=ACMRT)
if ($LASTEXITCODE -ne 0) { throw 'Could not list modified files.' }
$untracked = @(& git -C $sourceRoot ls-files --others --exclude-standard)
if ($LASTEXITCODE -ne 0) { throw 'Could not list new files.' }
$paths = @($modified + $untracked | Where-Object {
    $_ -match '^(js/|img/|fonts/|examples/)' -or $_ -match '^[^/]+\.(html|css)$'
} | Sort-Object -Unique | Sort-Object { $_ -eq 'index.html' }, { $_ })
$backupRoot = Join-Path ([IO.Path]::GetTempPath()) ('GameDialogueMaker-deploy-' + [guid]::NewGuid().ToString('N'))
$deployed = @()
foreach ($relative in $paths) {
    $source = [IO.Path]::GetFullPath((Join-Path $sourceRoot $relative))
    $target = [IO.Path]::GetFullPath((Join-Path $targetRoot $relative))
    if (-not $source.StartsWith($sourceRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
        -not $target.StartsWith($targetRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw "Path outside deployment roots: $relative"
    }
    $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
    if (Test-Path -LiteralPath $target -PathType Leaf) {
        if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -eq $sourceHash) { continue }
        $backup = Join-Path $backupRoot $relative
        New-Item -ItemType Directory -Path (Split-Path $backup) -Force | Out-Null
        Copy-Item -LiteralPath $target -Destination $backup
    }
    New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $sourceHash) {
        throw "Deployment verification failed: $relative"
    }
    $deployed += $relative
    Write-Output "Verified: $relative"
}
Write-Output "Deployed $($deployed.Count) changed files to $targetRoot"
if (Test-Path -LiteralPath $backupRoot) { Write-Output "Previous versions: $backupRoot" }
