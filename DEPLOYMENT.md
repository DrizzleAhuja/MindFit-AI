# FitSync Deployment Guide

## 🚀 Quick Start

Your FitSync application is now configured for deployment! Here's how to deploy it to GitHub and Vercel.

## 📋 Prerequisites

1. **GitHub Account** - Create a new repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Database** - Set up a MongoDB Atlas cluster
4. **Environment Variables** - Prepare your secrets

## 🔧 Step 1: GitHub Setup

### 1.1 Initialize Git Repository
```bash
# If not already done
git init
git add .
git commit -m "Initial commit: FitSync fitness tracking application"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `fitsync` (or your preferred name)
3. Make it public or private (your choice)

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/fitsync.git
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Vercel Deployment

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **What's your project's name?** → fitsync
- **In which directory is your code located?** → ./
- **Want to override the settings?** → No

### 2.3 Configure Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

```
MONGODB_URL=your_mongodb_atlas_connection_string
SESSION_SECRET=your_random_session_secret
JWT_SECRET=your_random_jwt_secret
NODE_ENV=production
```

### 2.4 Update CORS Origins

After deployment, update the CORS origins in `Server/index.js` with your Vercel domain:

```javascript
origin: process.env.NODE_ENV === "production" 
  ? ["https://your-app.vercel.app", "https://your-app-git-main.vercel.app"] 
  : "http://localhost:5173",
```

Replace `your-app.vercel.app` with your actual Vercel domain.

## 🔄 Step 3: Update API Calls (Important!)

Before deploying, update all API calls in your React components to use the new configuration:

### 3.1 Files to Update
- `src/pages/WorkoutPlanGenerator/Section1.jsx`
- `src/pages/VerficationPage/Section1.jsx`
- `src/pages/UserLogsPage/Section1.jsx`
- `src/pages/NotificationsPage/Section1.jsx`
- `src/pages/FitBot/Section1.jsx`
- `src/pages/EditProfilePage/Section1.jsx`
- `src/pages/BMICalculator/Section1.jsx`
- `src/pages/ContactusPage/Section1.jsx`
- `src/pages/AllUserLogsPage/Section1.jsx`

### 3.2 Update Process
For each file:
1. Add import: `import { API_ENDPOINTS } from "../../config/api";`
2. Replace hardcoded URLs:
   - `"http://localhost:8000/api/auth/login"` → `API_ENDPOINTS.LOGIN`
   - `"http://localhost:8000/api/bmi/history"` → `API_ENDPOINTS.BMI_HISTORY`
   - `"http://localhost:8000/api/reports"` → `API_ENDPOINTS.REPORTS`

## 🏗️ Step 4: Build and Test

### 4.1 Local Build Test
```bash
npm run build
npm start
```

### 4.2 Deploy Updates
After making changes:
```bash
git add .
git commit -m "Update: API configuration for deployment"
git push origin main
```

Vercel will automatically redeploy your application.

## 🔍 Step 5: Verification

### 5.1 Check Deployment
1. Visit your Vercel domain
2. Test all major features:
   - User registration/login
   - BMI calculator
   - Workout generation
   - AI features

### 5.2 Monitor Logs
In Vercel dashboard:
- Go to Functions tab
- Check for any errors
- Monitor API performance

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update CORS origins in `Server/index.js`
   - Ensure environment variables are set

2. **MongoDB Connection Issues**
   - Check your MongoDB Atlas connection string
   - Ensure IP whitelist includes Vercel's IPs

3. **Build Failures**
   - Check for missing dependencies
   - Verify all imports are correct

4. **API 404 Errors**
   - Ensure all API calls use the new configuration
   - Check Vercel routing in `vercel.json`

### Environment Variables Checklist
- [ ] `MONGODB_URL`
- [ ] `SESSION_SECRET`
- [ ] `JWT_SECRET`
- [ ] `NODE_ENV=production`

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with `npm run dev`
4. Check MongoDB connection

## 🎉 Success!

Once deployed, your FitSync application will be available at your Vercel domain with both frontend and backend running on the same port! 