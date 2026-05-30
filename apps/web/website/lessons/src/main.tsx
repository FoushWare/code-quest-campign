/*
  apps/web/website/lessons/src/main.tsx

  Lessons microfrontend entrypoint.
  - Purpose: standalone lesson player MFE. Runs on its own dev port and can
    be iframe-mounted by the website host during local development.
*/
import { createRoot } from 'react-dom/client';
import { webRuntime } from './runtime.generated';

// This app owns lesson delivery, challenge interaction, and answer flow.
function LessonsApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Website MFE: Lessons</h1>
      <p>Surface: {webRuntime.surface}</p>
      <p>Mode: {webRuntime.phase} / {webRuntime.serviceMode}</p>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<LessonsApp />);
}