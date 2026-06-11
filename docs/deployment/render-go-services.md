# Render Go Micro-services Deployment

This guide explains how to deploy the 5 Go micro-services to Render.com for production.

## Overview

- **Platform**: Render.com
- **Cost**: Free tier for web services
- **Architecture**: 5 Go micro-services
- **Deployment**: Docker-based with GitHub integration

## Prerequisites

1. Render account: https://dashboard.render.com/
2. GitHub repository connected to Render
3. Docker files configured for each service

## Deployment Steps

### 1. Connect GitHub to Render

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Click "Connect GitHub"
4. Authorize Render to access your repository
5. Select `FoushWare/code-quest-campign`

### 2. Deploy Auth Service

1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: `code-quest-auth`
   - **Environment**: Docker
   - **Dockerfile Path**: `./services/auth/Dockerfile`
   - **Docker Context**: `./services/auth`
   - **Branch**: `main`
   - **Plan**: Free
4. Add Environment Variables:
   - `PORT`: `8081`
   - `SERVICE_MODE`: `db`
5. Click "Create Web Service"

### 3. Deploy Content Service

Repeat the process for content service:
- **Name**: `code-quest-content`
- **Dockerfile Path**: `./services/content/Dockerfile`
- **Docker Context**: `./services/content`
- **PORT**: `8082`

### 4. Deploy Spaced-Repetition Service

- **Name**: `code-quest-spaced-repetition`
- **Dockerfile Path**: `./services/spaced-repetition/Dockerfile`
- **Docker Context**: `./services/spaced-repetition`
- **PORT**: `8083`

### 5. Deploy Gamification Service

- **Name**: `code-quest-gamification`
- **Dockerfile Path**: `./services/gamification/Dockerfile`
- **Docker Context**: `./services/gamification`
- **PORT**: `8084`

### 6. Deploy Leaderboard Service

- **Name**: `code-quest-leaderboard`
- **Dockerfile Path**: `./services/leaderboard/Dockerfile`
- **Docker Context**: `./services/leaderboard`
- **PORT**: `8085`

## Service URLs

After deployment, services will be available at:
- Auth: `https://code-quest-auth.onrender.com`
- Content: `https://code-quest-content.onrender.com`
- Spaced-repetition: `https://code-quest-spaced-repetition.onrender.com`
- Gamification: `https://code-quest-gamification.onrender.com`
- Leaderboard: `https://code-quest-leaderboard.onrender.com`

## Environment Variables

Add these environment variables to each service:

**Common for all services:**
- `PORT`: Service-specific port (8081-8085)
- `SERVICE_MODE`: `db` (for production)

**Additional variables (add as needed):**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `REDIS_URL`: Redis connection string

## Automatic Deployments

Render automatically deploys when you:
- Push to the connected branch
- Open a pull request
- Merge a pull request

**To disable auto-deploy:**
1. Go to service settings
2. Scroll to "Build & Deploy"
3. Disable "Auto-Deploy"

## Monitoring

**View logs:**
1. Go to service dashboard
2. Click "Logs" tab
3. View real-time logs

**Check service status:**
1. Go to service dashboard
2. View "Events" tab
3. Check deployment status

## Free Tier Limits

**Render Free Tier:**
- 512MB RAM per service
- 0.1 CPU per service
- Spins down after 15 minutes of inactivity
- Cold start on first request (~30 seconds)

**For production:**
- Consider upgrading to Starter plan ($7/month)
- Better performance and uptime
- No cold starts

## Troubleshooting

### Service not starting
- Check Dockerfile configuration
- Verify port configuration
- Review service logs for errors

### Cold start delays
- Free tier spins down after inactivity
- First request takes ~30 seconds
- Upgrade to paid tier for always-on

### Memory issues
- Free tier limited to 512MB RAM
- Optimize Go service memory usage
- Consider upgrading for production

### Build failures
- Check Dockerfile syntax
- Verify Docker context path
- Review build logs

## Next Steps

1. Deploy all 5 Go services to Render
2. Update frontend environment variables with Render URLs
3. Test micro-frontend integration with deployed services
4. Set up monitoring and alerting
5. Consider upgrading to paid tier for production

## Cost Management

- **Free tier**: $0 (with limitations)
- **Starter plan**: $7/month per service
- **Standard plan**: $25/month per service
- **Pro plan**: $75/month per service

**Recommendation:** Start with free tier, upgrade to Starter for production.
