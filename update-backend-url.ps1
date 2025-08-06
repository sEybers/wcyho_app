# PowerShell script to update all URLs with your actual Render backend URL
# Usage: .\update-backend-url.ps1 "your-actual-backend-url.onrender.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewBackendUrl
)

Write-Host "🔄 Updating backend URLs..." -ForegroundColor Green
Write-Host "New backend URL: https://$NewBackendUrl" -ForegroundColor Cyan

# Update .env.production
$envFile = "project_folder\WhenCanYouHangOut\.env.production"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $content = $content -replace "https://wcyho-backend\.onrender\.com/api", "https://$NewBackendUrl/api"
    Set-Content $envFile $content
    Write-Host "✅ Updated $envFile" -ForegroundColor Green
}

# Update netlify.toml
$netlifyFile = "netlify.toml"
if (Test-Path $netlifyFile) {
    $content = Get-Content $netlifyFile
    $content = $content -replace "https://wcyho-backend\.onrender\.com/api", "https://$NewBackendUrl/api"
    Set-Content $netlifyFile $content
    Write-Host "✅ Updated $netlifyFile" -ForegroundColor Green
}

# Update test scripts
$testFiles = @("test-deployment.sh", "test-deployment.ps1")
foreach ($file in $testFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file
        $content = $content -replace "https://wcyho-backend\.onrender\.com", "https://$NewBackendUrl"
        Set-Content $file $content
        Write-Host "✅ Updated $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Commit these changes: git add . && git commit -m 'Update backend URL to actual Render deployment'" -ForegroundColor White
Write-Host "2. Push to GitHub: git push origin seaneybers_laptop" -ForegroundColor White
Write-Host "3. Update Netlify environment variables with: VITE_API_URL=https://$NewBackendUrl/api" -ForegroundColor White
Write-Host "4. Run test script: .\test-deployment.ps1" -ForegroundColor White
