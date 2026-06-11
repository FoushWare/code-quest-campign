/*
  apps/web/website/league-social/src/main.tsx

  League & Social microfrontend entrypoint.
*/
import { createRoot } from 'react-dom/client';
import { webRuntime } from './runtime.generated';

// This app owns league standings, social ranking, and friend activity surfaces.
function LeagueSocialApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Website MFE: League and Social</h1>
      <p>Surface: {webRuntime.surface}</p>
      <p>Mode: {webRuntime.phase} / {webRuntime.serviceMode}</p>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<LeagueSocialApp />);
}