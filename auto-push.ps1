Set-Location "C:\ChampionTour"

Write-Host "ChampionTour Auto Push baþlatýldý..."

while ($true) {

    git add .

    $status = git status --porcelain

    if ($status) {

        $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

        git commit -m "Auto update $time"

        git push origin main

        Write-Host "Push tamamlandý: $time"
    }

    Start-Sleep -Seconds 10
}