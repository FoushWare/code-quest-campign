/*
  apps/web/website/learning-path/src/main.tsx

  Learning Path microfrontend entrypoint.
  - Purpose: small sandbox MFE demonstrating learner path UI. When run standalone
    it exposes its UI at a dedicated dev port and can be iframe-mounted by the
    website host for local composition.
  - For tracing: read `apps/web/website/src/runtime.generated.ts` for runtime config,
    then this file, then local components under `src/`.
*/
import { createRoot } from 'react-dom/client';
import { webRuntime } from './runtime.generated';

// This app owns learner path navigation and node progression UX.
function LearningPathApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Website MFE: Learning Path</h1>
      <p>Surface: {webRuntime.surface}</p>
      <p>Mode: {webRuntime.phase} / {webRuntime.serviceMode}</p>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<LearningPathApp />);
}