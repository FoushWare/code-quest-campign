# Vercel Deployment Guide for Micro-Frontends

This guide covers deploying the Code Quest Campaign micro-frontend architecture to Vercel.

## Architecture Overview

### Applications
- **web-shell** (Host): Module Federation host at port 4201
- **web-website** (Host): Main website host at port 4200
- **web-admin** (Host): Admin dashboard host at port 4202

### Website MFEs (exposed by web-website)
- web-website-learning-path (port 4210)
- web-website-lessons (port 4211)
- web-website-hearts-gems (port 4212)
- web-website-league-social (port 4213)
- web-website-profile-settings (port 4214)

### Admin MFEs (exposed by web-admin)
- web-admin-users (port 4220)
- web-admin-moderation (port 4221)
- web-admin-analytics (port 4222)
- web-admin-content-editor (port 4223)

## Deployment Strategy

### Option 1: Monorepo with Multiple Projects (Recommended)
Deploy each app as a separate Vercel project within the same monorepo.

**Vercel Free Tier Support:** ✅ Yes, Vercel Free tier supports unlimited projects. However, resources are shared across all projects in your account:
- **100GB bandwidth/month** (shared across all projects)
- **6,000 minutes execution time/month** (shared across all projects)
- **100GB-Hours serverless function execution** (shared across all projects)
- **Unlimited deployments** (with 100GB total bandwidth)
- **No custom domains** on Free tier (use `.vercel.app` subdomains)

**Custom Domain Support:** ❌ Custom domains like `elzatona-web.com` are **NOT available on Free tier**. Custom domains require Pro tier ($20/month) or higher.

**Alternatives for Free Tier:**
1. **Use Vercel subdomains**: `code-quest-shell.vercel.app`, `code-quest-website.vercel.app`, etc.
2. **DNS redirect**: Set up a redirect from your domain provider to point `elzatona-web.com` → `code-quest-shell.vercel.app`
3. **Subdomain CNAME**: If you have another hosting provider, you could set up a subdomain like `app.elzatona-web.com` that CNAMEs to the Vercel URL (but this still requires some hosting setup)

**For 12 apps (3 hosts + 9 MFEs):** This is feasible on Free tier if:
- Total traffic stays under 100GB/month
- Total execution time stays under 6,000 minutes/month
- You're okay with `.vercel.app` subdomains (no custom domains)
- You don't need advanced features (edge functions, analytics, etc.)

**Upgrade Considerations:** If you hit limits or need custom domains:
- **Pro tier ($20/month)**: 1TB bandwidth, 10,000 minutes execution, **custom domains** (unlimited), edge functions, analytics
- **Team tier ($40/month)**: All Pro features + team collaboration, SSO, priority support
- Or consolidate to Option 2 (single project) to reduce overhead

### Option 2: Single Project with Rewrites
Deploy everything as one Vercel project with path-based routing.

**Vercel Free Tier Support:** ✅ Yes, this works well on Free tier as it uses only one project's resources.

## Option 1: Multiple Vercel Projects (Recommended)

### Step 1: Create Vercel Projects

Create separate Vercel projects for each app. On Free tier, you can create unlimited projects.

**Recommended naming convention:**
1. **Shell Host**: `code-quest-shell`
2. **Website Host**: `code-quest-website`
3. **Admin Host**: `code-quest-admin`
4. **Website MFEs**: `code-quest-website-learning-path`, `code-quest-website-lessons`, `code-quest-website-hearts-gems`, `code-quest-website-league-social`, `code-quest-website-profile-settings`
5. **Admin MFEs**: `code-quest-admin-users`, `code-quest-admin-moderation`, `code-quest-admin-analytics`, `code-quest-admin-content-editor`

**Free Tier URLs:** Each project will get a `.vercel.app` subdomain:
- `code-quest-shell.vercel.app` (or your main entry point)
- `code-quest-website.vercel.app`
- `code-quest-admin.vercel.app`
- `code-quest-website-learning-path.vercel.app`
- `code-quest-website-lessons.vercel.app`
- `code-quest-website-hearts-gems.vercel.app`
- `code-quest-website-league-social.vercel.app`
- `code-quest-website-profile-settings.vercel.app`
- `code-quest-admin-users.vercel.app`
- `code-quest-admin-moderation.vercel.app`
- `code-quest-admin-analytics.vercel.app`
- `code-quest-admin-content-editor.vercel.app`

**With Custom Domain (Pro tier required):**
If you upgrade to Pro tier, you can add `elzatona-web.com` and configure:
- `elzatona-web.com` → `code-quest-shell.vercel.app` (main entry)
- `app.elzatona-web.com` → `code-quest-website.vercel.app`
- `admin.elzatona-web.com` → `code-quest-admin.vercel.app`
- Or use path-based routing on a single domain

### Step 2: Configure vercel.json for Each App

#### Shell Host (`apps/web/shell/vercel.json`)
```json
{
  "buildCommand": "npm run build:web-shell",
  "outputDirectory": "dist/apps/web-shell",
  "framework": null,
  "installCommand": "npm install",
  "env": {
    "CODE_QUEST_ENV": "production"
  }
}
```

#### Website Host (`apps/web/website/vercel.json`)
```json
{
  "buildCommand": "npm run build:web-website",
  "outputDirectory": "dist/apps/web-website",
  "framework": null,
  "installCommand": "npm install",
  "env": {
    "CODE_QUEST_ENV": "production"
  }
}
```

#### Admin Host (`apps/web/admin/vercel.json`)
```json
{
  "buildCommand": "npm run build:web-admin",
  "outputDirectory": "dist/apps/web-admin",
  "framework": null,
  "installCommand": "npm install",
  "env": {
    "CODE_QUEST_ENV": "production"
  }
}
```

#### Website MFEs (e.g., `apps/web/website/learning-path/vercel.json`)
```json
{
  "buildCommand": "npm run build:web-website-learning-path",
  "outputDirectory": "dist/apps/web-website-learning-path",
  "framework": null,
  "installCommand": "npm install",
  "env": {
    "CODE_QUEST_ENV": "production"
  }
}
```

#### Admin MFEs (e.g., `apps/web/admin/users/vercel.json`)
```json
{
  "buildCommand": "npm run build:web-admin-users",
  "outputDirectory": "dist/apps/web-admin-users",
  "framework": null,
  "installCommand": "npm install",
  "env": {
    "CODE_QUEST_ENV": "production"
  }
}
```

### Step 3: Configure Module Federation for Production

Update Module Federation config in each app to use production URLs:

#### Shell Host (`apps/web/shell/webpack.config.js` or Module Federation config)
```javascript
const ModuleFederationPlugin = require("@module-federation/nextjs-mf");

module.exports = {
  webpack(config, { isServer }) {
    config.plugins.push(
      new ModuleFederationPlugin({
        name: "shell",
        filename: "static/chunks/remoteEntry.js",
        remotes: {
          website: `website@${process.env.VERCEL_URL ? process.env.VERCEL_URL : 'http://localhost:4200'}/remoteEntry.js`,
          admin: `admin@${process.env.ADMIN_URL ? process.env.ADMIN_URL : 'http://localhost:4202'}/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          "react-dom": { singleton: true, requiredVersion: false },
        },
      })
    );
    return config;
  },
};
```

#### Website Host (`apps/web/website/webpack.config.js`)
```javascript
const ModuleFederationPlugin = require("@module-federation/nextjs-mf");

module.exports = {
  webpack(config, { isServer }) {
    config.plugins.push(
      new ModuleFederationPlugin({
        name: "website",
        filename: "static/chunks/remoteEntry.js",
        remotes: {
          learningPath: `learningPath@${process.env.LEARNING_PATH_URL ? process.env.LEARNING_PATH_URL : 'http://localhost:4210'}/remoteEntry.js`,
          lessons: `lessons@${process.env.LESSONS_URL ? process.env.LESSONS_URL : 'http://localhost:4211'}/remoteEntry.js`,
          heartsGems: `heartsGems@${process.env.HEARTS_GEMS_URL ? process.env.HEARTS_GEMS_URL : 'http://localhost:4212'}/remoteEntry.js`,
          leagueSocial: `leagueSocial@${process.env.LEAGUE_SOCIAL_URL ? process.env.LEAGUE_SOCIAL_URL : 'http://localhost:4213'}/remoteEntry.js`,
          profileSettings: `profileSettings@${process.env.PROFILE_SETTINGS_URL ? process.env.PROFILE_SETTINGS_URL : 'http://localhost:4214'}/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          "react-dom": { singleton: true, requiredVersion: false },
        },
      })
    );
    return config;
  },
};
```

#### Admin Host (`apps/web/admin/webpack.config.js`)
```javascript
const ModuleFederationPlugin = require("@module-federation/nextjs-mf");

module.exports = {
  webpack(config, { isServer }) {
    config.plugins.push(
      new ModuleFederationPlugin({
        name: "admin",
        filename: "static/chunks/remoteEntry.js",
        remotes: {
          users: `users@${process.env.USERS_URL ? process.env.USERS_URL : 'http://localhost:4220'}/remoteEntry.js`,
          moderation: `moderation@${process.env.MODERATION_URL ? process.env.MODERATION_URL : 'http://localhost:4221'}/remoteEntry.js`,
          analytics: `analytics@${process.env.ANALYTICS_URL ? process.env.ANALYTICS_URL : 'http://localhost:4222'}/remoteEntry.js`,
          contentEditor: `contentEditor@${process.env.CONTENT_EDITOR_URL ? process.env.CONTENT_EDITOR_URL : 'http://localhost:4223'}/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          "react-dom": { singleton: true, requiredVersion: false },
        },
      })
    );
    return config;
  },
};
```

### Step 4: Set Environment Variables in Vercel

For each Vercel project, set the following environment variables:

#### Shell Host
- `CODE_QUEST_ENV`: `production`
- `ADMIN_URL`: Your admin Vercel URL (e.g., `https://code-quest-admin.vercel.app`)

#### Website Host
- `CODE_QUEST_ENV`: `production`
- `LEARNING_PATH_URL`: Your learning-path MFE URL
- `LESSONS_URL`: Your lessons MFE URL
- `HEARTS_GEMS_URL`: Your hearts-gems MFE URL
- `LEAGUE_SOCIAL_URL`: Your league-social MFE URL
- `PROFILE_SETTINGS_URL`: Your profile-settings MFE URL

#### Admin Host
- `CODE_QUEST_ENV`: `production`
- `USERS_URL`: Your users MFE URL
- `MODERATION_URL`: Your moderation MFE URL
- `ANALYTICS_URL`: Your analytics MFE URL
- `CONTENT_EDITOR_URL`: Your content-editor MFE URL

#### MFEs
- `CODE_QUEST_ENV`: `production`

### Step 5: Deploy to Vercel

#### Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy each app
cd apps/web/shell
vercel --prod

cd ../website
vercel --prod

cd ../admin
vercel --prod

cd ../website/learning-path
vercel --prod

# Repeat for all MFEs...
```

#### Using Vercel Dashboard
1. Import each app directory as a separate project
2. Configure build settings as per vercel.json above
3. Set environment variables
4. Deploy

### Step 6: Update Remote URLs After Deployment

After deploying all apps, update the environment variables in each host with the actual Vercel URLs:

Example:
- `LEARNING_PATH_URL`: `https://code-quest-website-learning-path.vercel.app`
- `LESSONS_URL`: `https://code-quest-website-lessons.vercel.app`
- etc.

## Option 2: Single Vercel Project with Rewrites

### Root vercel.json
```json
{
  "buildCommand": "npm run ci:frontend",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/shell/:path*",
      "destination": "/apps/web/shell/:path*"
    },
    {
      "source": "/website/:path*",
      "destination": "/apps/web/website/:path*"
    },
    {
      "source": "/admin/:path*",
      "destination": "/apps/web/admin/:path*"
    },
    {
      "source": "/mfe/learning-path/:path*",
      "destination": "/apps/web/website/learning-path/:path*"
    },
    {
      "source": "/mfe/lessons/:path*",
      "destination": "/apps/web/website/lessons/:path*"
    }
    // Add other MFE rewrites...
  ]
}
```

## Shared Package Deployment

### Deploy shared-ui to Vercel (Optional)
If you want to deploy Storybook or the shared UI library:

```json
{
  "buildCommand": "npm run storybook:build",
  "outputDirectory": "storybook-static",
  "framework": null
}
```

## CI/CD Integration

### GitHub Actions for Vercel Deployment

Create `.github/workflows/vercel-deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy-shell:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_SHELL }}
          working-directory: ./apps/web/shell
          vercel-args: '--prod'

  deploy-website:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_WEBSITE }}
          working-directory: ./apps/web/website
          vercel-args: '--prod'

  # Add jobs for all other apps...
```

## Verification Steps

### 1. Check Build Output
```bash
# Build all apps locally first
npm run ci:frontend
```

### 2. Test Module Federation Locally
```bash
# Run all hosts and MFEs
npm run dev:web:all
```

### 3. Deploy to Preview Environment
Deploy to Vercel preview URLs first before production.

### 4. Test Remote Loading
- Open browser DevTools Network tab
- Check that remoteEntry.js files are loaded from correct URLs
- Verify no CORS errors

### 5. Test MFE Loading
- Navigate to each MFE route
- Verify MFE loads correctly
- Check console for Module Federation errors

## Troubleshooting

### Issue: Remote Entry Not Loading
**Solution**: Check that:
- Remote URLs are correct in environment variables
- Remote apps are deployed and accessible
- No CORS issues (Vercel handles this automatically)

### Issue: Version Mismatch
**Solution**: Ensure all apps use the same React version in package.json

### Issue: Build Memory Issues
**Solution**: Use the low-memory build scripts:
```bash
npm run build:web-shell:low-memory
```

### Issue: Static Assets Not Loading
**Solution**: Ensure `outputDirectory` is correct in vercel.json

## Performance Optimization

### 1. Enable Edge Functions
Add `edge: true` to API routes if using Next.js API routes.

### 2. Configure Caching
Add caching headers in vercel.json:
```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. Enable Image Optimization
Use Vercel's Image Optimization API for images.

## Monitoring

### 1. Vercel Analytics
Enable Vercel Analytics for each project to monitor performance.

### 2. Error Tracking
Integrate Sentry or similar for error tracking across MFEs.

### 3. Uptime Monitoring
Set up uptime monitoring for critical hosts and MFEs.

## Rollback Strategy

### 1. Git-Based Rollback
```bash
# Revert to previous commit
git revert HEAD
# Push to trigger redeploy
git push origin main
```

### 2. Vercel Dashboard Rollback
Use Vercel dashboard to rollback to previous deployment.

## Security Considerations

### 1. Environment Variables
- Never commit .env files
- Use Vercel environment variables for all secrets
- Rotate API keys regularly

### 2. CORS
- Configure CORS properly for API calls
- Use Vercel's built-in CORS handling

### 3. Authentication
- Implement authentication at the host level
- Share auth state across MFEs using cookies or tokens

## Cost Optimization

### 1. Bundle Size
- Use code splitting
- Lazy load MFEs
- Enable tree shaking

### 2. Build Time
- Use Vercel's caching
- Optimize webpack configuration
- Use Nx's caching

### 3. Bandwidth
- Enable compression
- Use CDN for static assets
- Optimize images

## Summary

1. **Create separate Vercel projects** for each host and MFE (recommended)
2. **Configure vercel.json** for each app with correct build settings
3. **Set environment variables** for Module Federation remote URLs
4. **Deploy hosts first**, then MFEs
5. **Update remote URLs** after deployment
6. **Test thoroughly** before going to production
7. **Monitor performance** and set up alerts
# Pipeline fix test
