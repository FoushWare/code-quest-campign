/*
  apps/web/admin/analytics/src/main.tsx

  Admin Analytics microfrontend entrypoint.
*/
import { createRoot } from 'react-dom/client';
import { webRuntime } from './runtime.generated';

// This app owns analytics dashboards and platform metrics for operators.
function AdminAnalyticsApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Admin MFE: Analytics</h1>
      <p>Surface: {webRuntime.surface}</p>
      <p>Mode: {webRuntime.phase} / {webRuntime.serviceMode}</p>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<AdminAnalyticsApp />);
}