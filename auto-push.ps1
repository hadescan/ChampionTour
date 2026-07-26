Set-Location "C:\ChampionTour"

Write-Host "ChampionTour Smart Auto Push başlatıldı..."

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "C:\ChampionTour"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$global:lastPush = Get-Date

$action = {

    $now = Get-Date

    if (($now - $global:lastPush).TotalSeconds -lt 5) {
        return
    }

    Start-Sleep -Seconds 2

    Set-Location "C:\ChampionTour"

    git add .

    if (git diff --cached --quiet) {
        return
    }

    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    git commit -m "Auto update $time"

    git push origin main

    Write-Host "✓ Push tamamlandı: $time"

    $global:lastPush = Get-Date
}

Register-ObjectEvent $watcher Changed -Action $action | Out-Null
Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -Action $action | Out-Null

while ($true) {
    Start-Sleep 1
}