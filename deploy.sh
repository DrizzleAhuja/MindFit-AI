#!/bin/bash

echo "🚀 FitSync Deployment Script"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: FitSync fitness tracking application"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🌐 Please add your GitHub repository as remote origin:"
    echo "   git remote add origin https://github.com/yourusername/fitsync.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
else
    echo "✅ Remote origin already configured"
    echo "📤 Pushing to GitHub..."
    git add .
    git commit -m "Update: Prepare for deployment"
    git push origin main
fi

echo ""
echo "🔧 Installing dependencies..."
npm install
cd Server && npm install && cd ..

echo ""
echo "🏗️ Building the application..."
npm run build

echo ""
echo "📋 Next steps for Vercel deployment:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Run: vercel"
echo "3. Set environment variables in Vercel dashboard:"
echo "   - MONGODB_URL"
echo "   - SESSION_SECRET"
echo "   - JWT_SECRET"
echo "   - NODE_ENV=production"
echo "4. Update CORS origins in Server/index.js with your Vercel domain"

echo ""
echo "✅ Deployment preparation complete!" 