param(
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $projectRoot "web"

function Add-PathEntry {
    param([string]$Directory)

    if (-not $Directory -or -not (Test-Path -LiteralPath $Directory -PathType Container)) {
        return
    }

    $entries = $env:Path -split ";"
    if ($entries -notcontains $Directory) {
        $env:Path = "$Directory;$env:Path"
    }
}

function Get-NodeExecutable {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = @($machinePath, $userPath, $env:Path) -join ";"

    $command = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) {
        return $command.Source
    }

    $candidates = @(
        $(if ($env:NVM_SYMLINK) { Join-Path $env:NVM_SYMLINK "node.exe" }),
        $(if ($env:ProgramFiles) { Join-Path $env:ProgramFiles "nodejs\node.exe" }),
        $(if (${env:ProgramFiles(x86)}) { Join-Path ${env:ProgramFiles(x86)} "nodejs\node.exe" }),
        $(if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA "Programs\nodejs\node.exe" }),
        $(if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA "Volta\bin\node.exe" }),
        $(if ($env:USERPROFILE) { Join-Path $env:USERPROFILE "scoop\apps\nodejs-lts\current\node.exe" }),
        $(if ($env:USERPROFILE) { Join-Path $env:USERPROFILE "scoop\apps\nodejs\current\node.exe" })
    ) | Where-Object { $_ }

    $registryKeys = @(
        "HKLM:\SOFTWARE\Node.js",
        "HKLM:\SOFTWARE\WOW6432Node\Node.js",
        "HKCU:\SOFTWARE\Node.js"
    )
    foreach ($key in $registryKeys) {
        try {
            $installPath = (Get-ItemProperty -LiteralPath $key -ErrorAction Stop).InstallPath
            if ($installPath) {
                $candidates += Join-Path $installPath "node.exe"
            }
        } catch {
            # The registry key is optional.
        }
    }

    if ($env:APPDATA) {
        $fnmRoot = Join-Path $env:APPDATA "fnm\node-versions"
        if (Test-Path -LiteralPath $fnmRoot) {
            $fnmNode = Get-ChildItem -LiteralPath $fnmRoot -Filter node.exe -File -Recurse -ErrorAction SilentlyContinue |
                Sort-Object FullName -Descending |
                Select-Object -First 1
            if ($fnmNode) {
                $candidates += $fnmNode.FullName
            }
        }
    }

    return $candidates |
        Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
        Select-Object -First 1
}

function Stop-WithMessage {
    param(
        [string[]]$Lines,
        [int]$ExitCode = 1
    )

    Write-Host ""
    foreach ($line in $Lines) {
        Write-Host $line -ForegroundColor Red
    }
    exit $ExitCode
}

function Get-AvailablePort {
    param(
        [int]$StartPort = 3000,
        [int]$EndPort = 3099
    )

    foreach ($port in $StartPort..$EndPort) {
        $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Any, $port)
        try {
            $listener.Start()
            return $port
        } catch {
            # Try the next port.
        } finally {
            $listener.Stop()
        }
    }

    Stop-WithMessage @("[ERROR] No available local port was found between $StartPort and $EndPort.")
}

$nodeExe = Get-NodeExecutable
if (-not $nodeExe) {
    Stop-WithMessage @(
        "[ERROR] Node.js was not found.",
        "Install the Node.js LTS version once, then restart Windows or sign out and sign in.",
        "Download: https://nodejs.org/en/download",
        "During installation, keep the option that adds Node.js to PATH enabled."
    )
}

$nodeDirectory = Split-Path -Parent $nodeExe
Add-PathEntry $nodeDirectory
$npmCmd = Join-Path $nodeDirectory "npm.cmd"
if (-not (Test-Path -LiteralPath $npmCmd -PathType Leaf)) {
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($npmCommand) {
        $npmCmd = $npmCommand.Source
    } else {
        Stop-WithMessage @(
            "[ERROR] Node.js was found, but npm.cmd is missing.",
            "Repair or reinstall the Node.js LTS version: https://nodejs.org/en/download"
        )
    }
}

$nodeVersionText = $null
try {
    $nodeVersionText = (& $nodeExe --version 2>$null).Trim().TrimStart("v")
} catch {
    Stop-WithMessage @(
        "[ERROR] Node.js was found but could not be started: $nodeExe",
        "Repair or reinstall the Node.js LTS version: https://nodejs.org/en/download"
    )
}
$nodeVersion = $null
if (-not [Version]::TryParse($nodeVersionText, [ref]$nodeVersion)) {
    Stop-WithMessage @("[ERROR] Could not read the installed Node.js version from: $nodeExe")
}

$supported = (($nodeVersion.Major -eq 20 -and $nodeVersion -ge [Version]"20.19.0") -or $nodeVersion -ge [Version]"22.12.0")
if (-not $supported) {
    Stop-WithMessage @(
        "[ERROR] Node.js v$nodeVersion is too old for Infinite Atelier.",
        "Install Node.js 20.19+ or 22.12+: https://nodejs.org/en/download"
    )
}

Write-Host "[INFO] Node.js v$nodeVersion" -ForegroundColor Cyan
Write-Host "[INFO] $nodeExe" -ForegroundColor DarkGray

if ($CheckOnly) {
    Write-Host "[OK] Node.js and npm are ready." -ForegroundColor Green
    exit 0
}

Set-Location -LiteralPath $webRoot

$requiredModules = @(
    "node_modules\vite\package.json",
    "node_modules\@rollup\rollup-win32-x64-msvc\package.json",
    "node_modules\@tailwindcss\oxide-win32-x64-msvc\package.json",
    "node_modules\@esbuild\win32-x64\package.json",
    "node_modules\lightningcss-win32-x64-msvc\package.json"
)
$needsInstall = $requiredModules | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) }

if (-not $needsInstall) {
    & $nodeExe -e "require('rollup'); require('@tailwindcss/oxide'); require('esbuild'); require('lightningcss')" 2>$null
    if ($LASTEXITCODE -ne 0) {
        $needsInstall = @("native module validation")
    }
}

if ($needsInstall) {
    Write-Host "[1/2] Installing project dependencies. This can take several minutes..." -ForegroundColor Cyan
    & $npmCmd install --legacy-peer-deps --include=optional --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage @(
            "[ERROR] Dependency installation failed.",
            "Check the network connection, then run start.bat again."
        ) $LASTEXITCODE
    }

    & $nodeExe -e "require('rollup'); require('@tailwindcss/oxide'); require('esbuild'); require('lightningcss')" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage @(
            "[ERROR] A required Windows native module is unavailable.",
            "Delete web\node_modules and run start.bat again."
        )
    }
}

$port = Get-AvailablePort
$localUrl = "http://localhost:$port"
Write-Host "[2/2] Starting Infinite Atelier at $localUrl" -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "ping 127.0.0.1 -n 5 >nul & start `"`" $localUrl" -WindowStyle Hidden
& $npmCmd run dev -- --port $port --strictPort
exit $LASTEXITCODE
