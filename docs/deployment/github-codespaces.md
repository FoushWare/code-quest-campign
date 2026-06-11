# GitHub Codespaces Setup

This guide explains how to use GitHub Codespaces for developing and running the Code Quest Campaign project, including Go micro-services and React micro-frontends.

## Overview

- **Platform**: GitHub Codespaces
- **Cost**: Free tier (60 hours/month for personal accounts)
- **Purpose**: Development and testing environment
- **Includes**: Node.js, Go, Docker, all project dependencies

## Getting Started

### 1. Create a Codespace

1. Go to your repository: https://github.com/FoushWare/code-quest-campign
2. Click the "Code" button
3. Select "Codespaces"
4. Click "New codespace"
5. Choose the branch (default: main)
6. Click "Create codespace"

### 2. Wait for Setup

The codespace will automatically:
- Install Node.js (LTS)
- Install Go (1.22)
- Install Docker
- Install project dependencies
- Generate web runtime configuration

Setup takes 2-5 minutes.

### 3. Start Development

Once setup is complete, start the development environment:

```bash
# Start all services (frontend + backend) in mock mode
npm run dev:full:mock

# Or start individual components
npm run dev:web              # Frontend hosts only
npm run dev:services:local:mock  # Go services only
```

## Available Ports

The following ports are automatically forwarded:

| Port | Service | Description |
|------|---------|-------------|
| 4200 | Website Host | Main website frontend |
| 4201 | Shell Host | Shell micro-frontend |
| 4202 | Admin Host | Admin panel frontend |
| 8081 | Auth Service | Authentication micro-service |
| 8082 | Content Service | Content management micro-service |
| 8083 | Spaced Repetition Service | Learning algorithm micro-service |
| 8084 | Gamification Service | Gamification micro-service |
| 8085 | Leaderboard Service | Leaderboard micro-service |

## Development Workflows

### Full Stack Development
```bash
# Start everything in mock mode (no database)
npm run dev:full:mock

# Start everything with database
npm run dev:full:db
```

### Frontend Only
```bash
# Start all frontend hosts
npm run dev:web

# Start specific host
npm run dev:web:website
npm run dev:web:shell
npm run dev:web:admin
```

### Backend Only
```bash
# Start all Go services in mock mode
npm run dev:services:local:mock

# Start all Go services with database
npm run dev:services:local:db
```

### Testing
```bash
# Run frontend tests
npm run ci:frontend

# Run backend tests
npm run ci:backend

# Run all CI checks
npm run ci
```

## Accessing Services

Once services are running, access them via the forwarded ports:

- Frontend: Click on the port notification in the bottom right corner
- Services: Use the URLs shown in the terminal output

## Persistent Storage

Codespaces include:
- Automatic git integration
- Persistent storage for your work
- VS Code extensions and settings
- Installed dependencies

## Limits and Quotas

**Free Tier (Personal Accounts):**
- 60 hours per month
- 2-core CPU
- 8GB RAM
- 32GB storage

**Usage Tips:**
- Stop codespace when not in use to save hours
- Delete unused codespaces
- Use lightweight development mode

## Troubleshooting

### Port Not Accessible
- Check if the service is running
- Verify the port is in the ports list
- Try manually forwarding the port

### Dependencies Not Installing
- Run `npm install` manually
- Check network connectivity
- Try rebuilding the codespace

### Go Services Not Starting
- Check Go version: `go version`
- Verify Go modules: `cd services/auth && go mod download`
- Check port conflicts

### Out of Memory
- Stop unused services
- Use mock mode instead of database mode
- Consider upgrading to paid tier

## Production Deployment

Codespaces is for development only. For production:
- Frontend: Deploy to Vercel (already configured)
- Backend: Use self-hosted Docker or VPS deployment
- See deployment guides for production setup

## Next Steps

1. Create a codespace and start development
2. Test all micro-frontends and micro-services
3. Deploy frontends to Vercel
4. Set up backend deployment for production

## Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Codespaces Pricing](https://github.com/features/codespaces/pricing)
- [Devcontainer Configuration](https://containers.dev/)
