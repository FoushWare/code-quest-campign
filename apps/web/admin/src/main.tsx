/*
  apps/web/admin/src/main.tsx

  Admin host container.
  - Purpose: compose admin-focused microfrontends (users, moderation, analytics, content-editor).
  - Composition style: iframes wired to local dev ports for each admin MFE.
  - Notes for onboarding: migrations should move feature UI and data-fetch logic from
    legacy monoliths into these per-feature MFEs; hosts keep routing and composition.
*/
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@code-quest/shared-ui';
import { webRuntime } from './runtime.generated';

const runtimePhase = String(webRuntime.phase);

type AdminView = 'users' | 'moderation' | 'analytics' | 'content-editor';

interface AdminState {
  activeView: AdminView;
  setView: (view: AdminView) => void;
}

const useAdminStore = create<AdminState>((set) => ({
  activeView: 'users',
  setView: (activeView) => set({ activeView }),
}));

const sourceLabel =
  runtimePhase === 'mock'
    ? 'frontend mock data'
    : runtimePhase === 'api-mock'
      ? 'frontend + API mock'
      : 'frontend + API + database';

const adminFeatures: Array<{ id: AdminView; label: string; detail: string; url: string }> = [
  {
    id: 'users',
    label: 'Users',
    detail: 'Manage learners, roles, and enrollment state.',
    url: 'http://localhost:4220',
  },
  {
    id: 'moderation',
    label: 'Moderation',
    detail: 'Queue review, reporting, and trust actions.',
    url: 'http://localhost:4221',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    detail: 'Growth and engagement dashboards for operations.',
    url: 'http://localhost:4222',
  },
  {
    id: 'content-editor',
    label: 'Content Editor',
    detail: 'Lesson authoring and publishing workflow tools.',
    url: 'http://localhost:4223',
  },
];

function AdminApp() {
  const { activeView, setView } = useAdminStore();
  const feature = useMemo(() => adminFeatures.find((entry) => entry.id === activeView) ?? adminFeatures[0], [activeView]);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 24,
        background:
          'radial-gradient(circle at top, rgba(250, 204, 21, 0.14), transparent 32%), linear-gradient(180deg, #09111f 0%, #0f172a 100%)',
        color: '#e2e8f0',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ margin: '0 auto', maxWidth: 1040 }}>
        <Card>
          <CardHeader>
            <Badge tone="warning">Admin host</Badge>
            <div style={{ height: 12 }} />
            <CardTitle>Code Quest Admin</CardTitle>
            <CardDescription>
              Operations host container composing dedicated admin microfrontends.
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              {adminFeatures.map((entry) => (
                <Button
                  key={entry.id}
                  variant={entry.id === activeView ? 'default' : 'secondary'}
                  onClick={() => setView(entry.id)}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div style={{ height: 24 }} />

        <div
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          <Card>
            <CardHeader>
              <Badge tone="success">Composed feature</Badge>
              <div style={{ height: 12 }} />
              <CardTitle>{feature.label}</CardTitle>
              <CardDescription>{feature.detail}</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
                The selected admin MFE is mounted below from a dedicated runtime endpoint.
              </div>
              <div style={{ height: 12 }} />
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
                endpoint: {feature.url}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge tone="outline">Mounted MFE</Badge>
              <div style={{ height: 12 }} />
              <CardTitle>{feature.label}</CardTitle>
              <CardDescription>Iframe host bridge for local composition.</CardDescription>
            </CardHeader>
            <CardContent>
              <iframe
                key={feature.id}
                title={`${feature.id}-microfrontend`}
                src={feature.url}
                style={{
                  width: '100%',
                  minHeight: 520,
                  border: '1px solid rgba(148, 163, 184, 0.28)',
                  borderRadius: 16,
                  backgroundColor: '#020617',
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<AdminApp />);
}