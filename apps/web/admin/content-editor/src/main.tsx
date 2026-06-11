/*
  apps/web/admin/content-editor/src/main.tsx

  Admin Content Editor microfrontend entrypoint.
*/
import { createRoot } from 'react-dom/client';
import { webRuntime } from './runtime.generated';

// This app owns lesson, node, and curriculum editing workflows.
function AdminContentEditorApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Admin MFE: Content Editor</h1>
      <p>Surface: {webRuntime.surface}</p>
      <p>Mode: {webRuntime.phase} / {webRuntime.serviceMode}</p>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<AdminContentEditorApp />);
}