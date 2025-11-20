#!/bin/bash
set -e

echo "🚀 Starting Vercel Deployment"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null && ! npx vercel --version &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it: npm i -g vercel"
    exit 1
fi

VERCEL_CMD="npx vercel"

# Step 1: Deploy Backend
echo ""
echo "${BLUE}Step 1: Deploying Backend...${NC}"
cd backend

# Deploy backend
echo "Deploying backend to Vercel..."
BACKEND_DEPLOYMENT=$($VERCEL_CMD --yes --prod 2>&1 | tee /tmp/backend-deploy.log)

# Extract backend URL from deployment output
BACKEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/backend-deploy.log | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
    echo "${YELLOW}⚠️  Could not extract backend URL automatically.${NC}"
    echo "Please check the deployment output above and set BACKEND_URL manually."
    read -p "Enter backend URL: " BACKEND_URL
fi

echo "${GREEN}✅ Backend deployed at: $BACKEND_URL${NC}"

cd ..

# Step 2: Deploy Frontend
echo ""
echo "${BLUE}Step 2: Deploying Frontend...${NC}"
cd frontend

# Set backend URL as environment variable for deployment
export NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL

echo "Deploying frontend to Vercel with BACKEND_URL=$BACKEND_URL..."
FRONTEND_DEPLOYMENT=$($VERCEL_CMD --yes --prod 2>&1 | tee /tmp/frontend-deploy.log)

# Extract frontend URL
FRONTEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/frontend-deploy.log | head -1 || echo "")

if [ -z "$FRONTEND_URL" ]; then
    echo "${YELLOW}⚠️  Could not extract frontend URL automatically.${NC}"
    echo "Please check the deployment output above."
else
    echo "${GREEN}✅ Frontend deployed at: $FRONTEND_URL${NC}"
fi

cd ..

echo ""
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "${YELLOW}⚠️  IMPORTANT: You need to set environment variables in Vercel Dashboard:${NC}"
echo "1. Backend project: Set DATABASE_URL, AUTH0_DOMAIN, AUTH0_AUDIENCE, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY"
echo "2. Frontend project: Set AUTH0_* variables and NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL"
echo ""
echo "See BACKEND_ENV_VARIABLES.txt and VERCEL_ENV_VALUES.txt for details."

