# PowerShell Test script to verify deployment
Write-Host "🧪 Testing WCYHO Deployment..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Blue

# Test 1: Check if backend is accessible
Write-Host "📡 Testing backend connectivity..." -ForegroundColor Yellow
$BackendUrl = "https://wcyho-backend.onrender.com"

try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/api/users" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend is accessible at $BackendUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT accessible at $BackendUrl" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check CORS headers
Write-Host "🌐 Testing CORS headers..." -ForegroundColor Yellow
try {
    $corsResponse = Invoke-WebRequest -Uri "$BackendUrl/api/users" -Method OPTIONS -Headers @{"Origin"="https://wcyho.netlify.app"} -ErrorAction Stop
    if ($corsResponse.Headers.ContainsKey("Access-Control-Allow-Origin")) {
        Write-Host "✅ CORS headers are present" -ForegroundColor Green
    } else {
        Write-Host "❌ CORS headers are missing" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test frontend
Write-Host "🎨 Testing frontend..." -ForegroundColor Yellow
$FrontendUrl = "https://wcyho.netlify.app"

try {
    $frontendResponse = Invoke-WebRequest -Uri $FrontendUrl -Method GET -ErrorAction Stop
    Write-Host "✅ Frontend is accessible at $FrontendUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend is NOT accessible at $FrontendUrl" -ForegroundColor Red
}

Write-Host "================================" -ForegroundColor Blue
Write-Host "🏁 Test completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If backend test fails: Check Render deployment logs" -ForegroundColor White
Write-Host "2. If CORS test fails: Verify environment variables in Render" -ForegroundColor White
Write-Host "3. If frontend test fails: Check Netlify build logs" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Visit your app: $FrontendUrl" -ForegroundColor Magenta
