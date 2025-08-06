#!/bin/bash

# Test script to verify deployment
echo "🧪 Testing WCYHO Deployment..."
echo "================================"

# Test 1: Check if backend is accessible
echo "📡 Testing backend connectivity..."
BACKEND_URL="https://wcyho-backend.onrender.com"

if curl -s "$BACKEND_URL/api/users" > /dev/null; then
    echo "✅ Backend is accessible at $BACKEND_URL"
else
    echo "❌ Backend is NOT accessible at $BACKEND_URL"
fi

# Test 2: Check CORS headers
echo "🌐 Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/users" -H "Origin: https://wcyho.netlify.app")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers are present"
else
    echo "❌ CORS headers are missing"
fi

# Test 3: Test frontend
echo "🎨 Testing frontend..."
FRONTEND_URL="https://wcyho.netlify.app"

if curl -s "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend is accessible at $FRONTEND_URL"
else
    echo "❌ Frontend is NOT accessible at $FRONTEND_URL"
fi

echo "================================"
echo "🏁 Test completed!"
echo ""
echo "Next steps:"
echo "1. If backend test fails: Check Render deployment logs"
echo "2. If CORS test fails: Verify environment variables in Render"
echo "3. If frontend test fails: Check Netlify build logs"
echo ""
echo "🌐 Visit your app: $FRONTEND_URL"
