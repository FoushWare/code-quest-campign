/*
  apps/web/website/hearts-gems/src/main.tsx

  Hearts & Gems microfrontend entrypoint.
*/
import { createRoot } from 'react-dom/client';
import { webRuntime } from './runtime.generated';

// This app owns hearts, gems, and rewards interactions for learners.
function HeartsGemsApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Website MFE: Hearts and Gems</h1>
      <p>Surface: {webRuntime.surface}</p>
      <p>Mode: {webRuntime.phase} / {webRuntime.serviceMode}</p>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<HeartsGemsApp />);
}