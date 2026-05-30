/*
  apps/web/shell/src/main.tsx

  Host shell for the Code Quest Campaign monorepo.
  - Purpose: provide a small dashboard to launch and inspect the various front-end
    surfaces (hosts and microfrontends) and show service probe status.
  - This file is intentionally lightweight: it does not embed feature UI. Instead it
    lists endpoints and helps developers run and validate composed surfaces.
  - Composition method: local development uses iframe mounting in hosts. This shell
    lists host and MFE endpoints so you can open them directly.

  Read order when exploring: runtime.generated.ts -> this file -> host entrypoints
  (apps/web/website/src/main.tsx and apps/web/admin/src/main.tsx) -> individual MFE
  main files.
*/
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@code-quest/shared-ui';
import { webRuntime } from './runtime.generated';

const runtimePhase = String(webRuntime.phase);

type WorkspaceSurface = 'shell' | 'admin' | 'mobile' | 'services';

interface ShellState {
  activeSurface: WorkspaceSurface;
  viewCount: number;
  setSurface: (surface: WorkspaceSurface) => void;
  bumpViewCount: () => void;
}

interface ProbeResult {
  name: string;
  ok: boolean;
  source: string;
}

interface LaunchableApp {
  id: string;
  name: string;
  description: string;
  url: string;
  group: 'host' | 'website-mfe' | 'admin-mfe';
}

const useShellStore = create<ShellState>((set) => ({
  activeSurface: 'shell',
  viewCount: 1,
  setSurface: (activeSurface) => set({ activeSurface }),
  bumpViewCount: () => set((state) => ({ viewCount: state.viewCount + 1 })),
}));

const sourceLabel =
  runtimePhase === 'mock'
    ? 'frontend mock data'
    : runtimePhase === 'api-mock'
      ? 'frontend + API mock'
      : 'frontend + API + database';

const surfaces: Array<{ id: WorkspaceSurface; name: string; description: string; url: string }> = [
  {
    id: 'shell',
    name: 'Web Shell',
    description: 'Host shell for the learner experience and remote surfaces.',
    url: '/apps/web/shell',
  },
  {
    id: 'admin',
    name: 'Composed Hosts',
    description: 'Website and admin host containers that mount feature MFEs.',
    url: '/apps/web/admin',
  },
  {
    id: 'mobile',
    name: 'Mobile',
    description: 'Expo entrypoint reserved for the native learner app.',
    url: '/apps/mobile',
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Go microservices that back auth, content, gamification, and leaderboard.',
    url: '/services',
  },
];

const launchableApps: LaunchableApp[] = [
  {
    id: 'website-host',
    name: 'Website Host',
    description: 'Composes learner MFEs.',
    url: 'http://localhost:4200',
    group: 'host',
  },
  {
    id: 'admin-host',
    name: 'Admin Host',
    description: 'Composes admin MFEs.',
    url: 'http://localhost:4202',
    group: 'host',
  },
  {
    id: 'website-learning-path',
    name: 'Website / Learning Path',
    description: 'Learner path map MFE.',
    url: 'http://localhost:4210',
    group: 'website-mfe',
  },
  {
    id: 'website-lessons',
    name: 'Website / Lessons',
    description: 'Lesson flow MFE.',
    url: 'http://localhost:4211',
    group: 'website-mfe',
  },
  {
    id: 'website-hearts-gems',
    name: 'Website / Hearts & Gems',
    description: 'Hearts and gems MFE.',
    url: 'http://localhost:4212',
    group: 'website-mfe',
  },
  {
    id: 'website-league-social',
    name: 'Website / League & Social',
    description: 'Leaderboard and social MFE.',
    url: 'http://localhost:4213',
    group: 'website-mfe',
  },
  {
    id: 'website-profile-settings',
    name: 'Website / Profile & Settings',
    description: 'Profile settings MFE.',
    url: 'http://localhost:4214',
    group: 'website-mfe',
  },
  {
    id: 'admin-users',
    name: 'Admin / Users',
    description: 'User management MFE.',
    url: 'http://localhost:4220',
    group: 'admin-mfe',
  },
  {
    id: 'admin-moderation',
    name: 'Admin / Moderation',
    description: 'Moderation workflow MFE.',
    url: 'http://localhost:4221',
    group: 'admin-mfe',
  },
  {
    id: 'admin-analytics',
    name: 'Admin / Analytics',
    description: 'Analytics MFE.',
    url: 'http://localhost:4222',
    group: 'admin-mfe',
  },
  {
    id: 'admin-content-editor',
    name: 'Admin / Content Editor',
    description: 'Content authoring MFE.',
    url: 'http://localhost:4223',
    group: 'admin-mfe',
  },
];

function useServiceProbes() {
  const [probes, setProbes] = useState<ProbeResult[]>([
    { name: 'auth', ok: true, source: 'mock' },
    { name: 'content', ok: true, source: 'mock' },
  ]);

  useEffect(() => {
    if (runtimePhase === 'mock') {
      setProbes([
        { name: 'auth', ok: true, source: 'mock' },
        { name: 'content', ok: true, source: 'mock' },
      ]);
      return;
    }

    let cancelled = false;

    Promise.all([
      fetch(`${webRuntime.apiBaseUrls.auth}/health`).then((response) => response.ok),
      fetch(`${webRuntime.apiBaseUrls.content}/health`).then((response) => response.ok),
    ])
      .then(([authOk, contentOk]) => {
        if (cancelled) {
          return;
        }

        setProbes([
          { name: 'auth', ok: authOk, source: webRuntime.serviceMode },
          { name: 'content', ok: contentOk, source: webRuntime.serviceMode },
        ]);
      })
      .catch(() => {
        if (!cancelled) {
          setProbes([
            { name: 'auth', ok: false, source: 'offline' },
            { name: 'content', ok: false, source: 'offline' },
          ]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return probes;
}

function App() {
  const { activeSurface, bumpViewCount, setSurface, viewCount } = useShellStore();
  const selectedSurface = surfaces.find((surface) => surface.id === activeSurface) ?? surfaces[0];
  const probes = useServiceProbes();

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 24,
        background:
          'radial-gradient(circle at top, rgba(74, 222, 128, 0.16), transparent 34%), linear-gradient(180deg, #07111f 0%, #0b1324 100%)',
        color: '#e2e8f0',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ margin: '0 auto', maxWidth: 1180 }}>
        <Card style={{ marginBottom: 24 }}>
          <CardHeader>
            <Badge tone="default">Microfrontend host</Badge>
            <div style={{ height: 12 }} />
            <CardTitle>Code Quest Campaign</CardTitle>
            <CardDescription>
              Zustand-backed shell with shadcn-style primitives and separate frontend/service surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              <Badge tone="success">{sourceLabel}</Badge>
              <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                surface: {webRuntime.surface} | container: {webRuntime.containerRole} | service mode: {webRuntime.serviceMode}
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {surfaces.map((surface) => (
                <Button
                  key={surface.id}
                  variant={surface.id === activeSurface ? 'default' : 'secondary'}
                  onClick={() => setSurface(surface.id)}
                >
                  {surface.name}
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={bumpViewCount}>Increment shell state ({viewCount})</Button>
          </CardFooter>
        </Card>

        <div
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          <Card>
            <CardHeader>
              <Badge tone="success">Active surface</Badge>
              <div style={{ height: 12 }} />
              <CardTitle>{selectedSurface.name}</CardTitle>
              <CardDescription>{selectedSurface.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
                This shell is set up as a separate deployable frontend. The admin app and the mobile app
                remain independent surfaces so they can evolve and ship separately.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge tone="outline">Service layer</Badge>
              <div style={{ height: 12 }} />
              <CardTitle>Microservices</CardTitle>
              <CardDescription>Each service exposes a lightweight health endpoint and sample API surface.</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gap: 10 }}>
                {probes.map((probe) => (
                  <div
                    key={probe.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 14,
                      backgroundColor: 'rgba(15, 23, 42, 0.72)',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{probe.name}</span>
                    <span style={{ color: probe.ok ? '#4ade80' : '#f87171', fontSize: 13 }}>
                      {probe.source}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div style={{ height: 24 }} />

        <Card>
          <CardHeader>
            <Badge tone="warning">Composition registry</Badge>
            <div style={{ height: 12 }} />
            <CardTitle>Host and microfrontend launch points</CardTitle>
            <CardDescription>Use these endpoints to run and validate composed local surfaces.</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gap: 10 }}>
              {launchableApps.map((app) => (
                <div
                  key={app.id}
                  style={{
                    display: 'grid',
                    gap: 8,
                    borderRadius: 14,
                    backgroundColor: 'rgba(15, 23, 42, 0.72)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontWeight: 600 }}>{app.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{app.group}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>{app.description}</div>
                  <a href={app.url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: 13 }}>
                    {app.url}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(<App />);
}
