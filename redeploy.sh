#!/bin/bash

# Script para rebuild e commit
echo "🔨 Building frontend..."
npm run build

echo "📝 Committing changes..."
git add src/environments/environment.prod.ts
git commit -m "fix: update production API URL"

echo "🚀 Pushing to GitHub..."
git push

echo "✅ Done! Netlify will auto-deploy."
