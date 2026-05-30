# Frontend Guide

This guide covers the web hosts, microfrontends (MFEs), shared UI, and how to run them locally.

## What belongs here

- `apps/web/shell` - developer shell and quick-launch dashboard
- `apps/web/website` - learner-facing host container
- `apps/web/admin` - admin host container
- `apps/web/website/*` - website MFEs
- `apps/web/admin/*` - admin MFEs
- `packages/shared-ui` - shared UI components used by hosts and MFEs

## Runtime setup

Run this before starting frontend dev servers so every app gets a generated `runtime.generated.ts`:

```bash
npm run prepare:web-runtime:dev
```

Use `npm run prepare:web-runtime:prod` when you want production-like runtime values.

## CI/CD on Vercel

Each frontend surface is treated as its own Vercel project.

The workflow at `.github/workflows/frontend-vercel.yml` does two things:

1. Runs a build for every frontend app on pull requests and pushes.
2. Triggers the matching Vercel deploy hook on pushes to `main`.

Required GitHub secrets:

- `VERCEL_DEPLOY_HOOK_WEB_SHELL`
- `VERCEL_DEPLOY_HOOK_WEB_WEBSITE`
- `VERCEL_DEPLOY_HOOK_WEB_ADMIN`
- `VERCEL_DEPLOY_HOOK_WEB_WEBSITE_LEARNING_PATH`
- `VERCEL_DEPLOY_HOOK_WEB_WEBSITE_LESSONS`
- `VERCEL_DEPLOY_HOOK_WEB_WEBSITE_HEARTS_GEMS`
- `VERCEL_DEPLOY_HOOK_WEB_WEBSITE_LEAGUE_SOCIAL`
- `VERCEL_DEPLOY_HOOK_WEB_WEBSITE_PROFILE_SETTINGS`
- `VERCEL_DEPLOY_HOOK_WEB_ADMIN_USERS`
- `VERCEL_DEPLOY_HOOK_WEB_ADMIN_MODERATION`
- `VERCEL_DEPLOY_HOOK_WEB_ADMIN_ANALYTICS`
- `VERCEL_DEPLOY_HOOK_WEB_ADMIN_CONTENT_EDITOR`

How to set it up in Vercel:

1. Create one Vercel project per frontend app.
2. Attach each project to the matching repo subdirectory.
3. Create a deploy hook for each project.
4. Store the hook URL in the matching GitHub secret.

Why this model works:

- Each MFE stays independently deployable.
- PRs get build validation without deploying.
- `main` pushes trigger production deploys for the exact app that changed.

If ports are already busy, clean them first:

```bash
npm run dev:cleanup
```

## Run the hosts

```bash
npm run dev:web:website:host   # website host on :4200
npm run dev:web:admin:host     # admin host on :4202
npm run dev:web:hosts          # shell + website + admin hosts together
```

## Run the website MFEs one by one

```bash
npm run dev:web:website:learning-path
npm run dev:web:website:lessons
npm run dev:web:website:hearts-gems
npm run dev:web:website:league-social
npm run dev:web:website:profile-settings
```

## Run the admin MFEs one by one

```bash
npm run dev:web:admin:users
npm run dev:web:admin:moderation
npm run dev:web:admin:analytics
npm run dev:web:admin:content-editor
```

## Grouped test runs

```bash
npm run dev:web:website:mfes   # all website MFEs together
npm run dev:web:admin:mfes     # all admin MFEs together
npm run dev:web:website:all    # website host + all website MFEs
npm run dev:web:admin:all      # admin host + all admin MFEs
npm run dev:web:all-mfes       # all website + all admin MFEs
npm run dev:web:all            # all hosts + all MFEs
```

## How to test

1. Start the host you want to verify.
2. Start the matching MFE in a separate terminal.
3. Open the host in the browser and select the MFE.
4. Check the browser console and terminal output for build or runtime errors.

## Validation commands

```bash
npx nx run web-website:build
npx nx run web-website-learning-path:build
npx nx run web-admin:build
npx nx run web-admin-users:build
```

## Notes

- Hosts compose MFEs with `iframe` during local development.
- Each MFE owns its own UI and local state.
- Use `webRuntime.apiBaseUrls` for service endpoints instead of hard-coding URLs.
