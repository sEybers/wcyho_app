# WCYHO Deployment Guide

## 🚀 Quick Deployment Checklist

### ✅ Backend Deployment (Render)
1. **Go to [render.com](https://render.com)**
2. **Sign in with GitHub**
3. **Create New Web Service**:
   - Repository: `sEybers/wcyho_app`
   - Branch: `seaneybers_laptop`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Environment Variables**:
   ```
   MONGO_URI=mongodb+srv://seaneybers:Admin1@wcyho.trvu47w.mongodb.net/wcyho_app?retryWrites=true&w=majority
   JWT_SECRET=your_super_secure_production_jwt_secret_minimum_32_characters_12345
   NODE_ENV=production
   ```

5. **Deploy and wait for completion**

### ✅ Frontend Deployment (Netlify)
1. **Already configured** - should auto-deploy from GitHub
2. **Update environment variable** in Netlify dashboard:
   - `VITE_API_URL = https://your-actual-render-url.onrender.com/api`

### 🔄 Update URLs After Render Deployment
Once you get your Render URL (e.g., `wcyho-backend-abc123.onrender.com`):

1. **Run the update script**:
   ```powershell
   .\update-backend-url.ps1 "wcyho-backend-abc123.onrender.com"
   ```

2. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Update backend URL to actual Render deployment"
   git push origin seaneybers_laptop
   ```

3. **Update Netlify environment variables**

### 🧪 Test Deployment
Run the test script to verify everything works:
```powershell
.\test-deployment.ps1
```

## 🔧 Troubleshooting

### CORS Errors
- Check Render logs for CORS debug messages
- Verify `NODE_ENV=production` is set in Render
- Ensure Netlify URL is correctly allowed in backend

### Backend Not Accessible
- Check Render deployment logs
- Verify environment variables are set
- Ensure `server` directory is used as root

### Frontend Issues
- Check Netlify build logs
- Verify `VITE_API_URL` environment variable
- Ensure build command is `npm run build`

## 📱 Features to Test
Once deployed, test these features:
- ✅ User registration/login
- ✅ Create and edit schedules
- ✅ Multi-day event creation
- ✅ 24-hour weekly view
- ✅ Schedule comparison
- ✅ Friend system

## 🌐 URLs
- **Frontend**: https://wcyho.netlify.app
- **Backend**: https://your-render-url.onrender.com
- **Database**: MongoDB Atlas (cloud)
