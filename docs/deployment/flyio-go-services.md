# Fly.io Go Micro-services Deployment

This guide explains how to deploy the 5 Go micro-services to Fly.io using free tier accounts.

## Overview

- **Platform**: Fly.io
- **Cost**: Free (using multiple accounts)
- **Architecture**: 5 Go micro-services
- **Strategy**: Use 2 Fly.io accounts to get 6 free app slots (enough for 5 services)

## Account Setup

### Account 1 (3 free apps)
- Email: account1@example.com
- Services: auth, content, spaced-repetition
- Region: sjc (San Jose)

### Account 2 (3 free apps)  
- Email: account2@example.com
- Services: gamification, leaderboard, +1 spare
- Region: sjc (San Jose)

## Prerequisites

1. Install Fly.io CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly.io:
```bash
flyctl auth login
```

## Deployment Steps

### Account 1 Setup

1. Login with account 1:
```bash
flyctl auth login
```

2. Deploy auth service:
```bash
cd services/auth
flyctl launch
# Follow prompts, use app name: code-quest-auth
flyctl deploy
```

3. Deploy content service:
```bash
cd services/content
flyctl launch
# Follow prompts, use app name: code-quest-content
flyctl deploy
```

4. Deploy spaced-repetition service:
```bash
cd services/spaced-repetition
flyctl launch
# Follow prompts, use app name: code-quest-spaced-repetition
flyctl deploy
```

### Account 2 Setup

1. Logout and login with account 2:
```bash
flyctl auth logout
flyctl auth login
```

2. Deploy gamification service:
```bash
cd services/gamification
flyctl launch
# Follow prompts, use app name: code-quest-gamification
flyctl deploy
```

3. Deploy leaderboard service:
```bash
cd services/leaderboard
flyctl launch
# Follow prompts, use app name: code-quest-leaderboard
flyctl deploy
```

## Using NPM Scripts

After initial setup, you can deploy using npm scripts:

### Deploy individual services:
```bash
npm run deploy:fly:auth
npm run deploy:fly:content
npm run deploy:fly:spaced-repetition
npm run deploy:fly:gamification
npm run deploy:fly:leaderboard
```

### Deploy by account:
```bash
# Account 1 services
npm run deploy:fly:account1

# Account 2 services  
npm run deploy:fly:account2
```

### Deploy all services:
```bash
npm run deploy:fly:all
```

## Service Configuration

Each service has a `fly.toml` file with:

- **App name**: Unique per service
- **Region**: sjc (San Jose)
- **Port**: Service-specific (8081-8085)
- **Resources**: 1 CPU, 256MB RAM (free tier)
- **Health checks**: GET /health endpoint
- **Auto-scaling**: Scales to zero when not in use

## Service URLs

After deployment, services will be available at:

- Auth: `https://code-quest-auth.fly.dev`
- Content: `https://code-quest-content.fly.dev`
- Spaced-repetition: `https://code-quest-spaced-repetition.fly.dev`
- Gamification: `https://code-quest-gamification.fly.dev`
- Leaderboard: `https://code-quest-leaderboard.fly.dev`

## Environment Variables

Add environment variables via Fly.io dashboard or CLI:

```bash
flyctl secrets set DATABASE_URL=your_db_url
flyctl secrets set JWT_SECRET=your_jwt_secret
```

## Monitoring

Check service status:
```bash
flyctl status
```

View logs:
```bash
flyctl logs
```

## Troubleshooting

### Service not starting
```bash
flyctl status
flyctl logs
```

### Health check failing
- Ensure `/health` endpoint exists in your Go service
- Check service logs for errors
- Verify port configuration matches fly.toml

### Out of memory
- Free tier is 256MB RAM
- Optimize Go service memory usage
- Consider upgrading to paid tier if needed

## Cost Management

- **Free tier**: 3 apps per account, 256MB RAM each
- **Paid tier**: $5-6/month per additional app
- **Total cost**: $0 for all 5 services using 2 accounts

## Next Steps

1. Deploy all 5 services to Fly.io
2. Update frontend environment variables with service URLs
3. Test micro-frontend integration with deployed services
4. Set up monitoring and alerting
