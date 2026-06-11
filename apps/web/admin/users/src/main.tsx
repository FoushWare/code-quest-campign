/*
  apps/web/admin/users/src/main.tsx

  Admin Users microfrontend entrypoint.
*/
import { createRoot } from 'react-dom/client';
import { webRuntime } from './runtime.generated';

// This app owns user and role administration screens.
function AdminUsersApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Admin MFE: Users</h1>
      <p>Surface: {webRuntime.surface}</p>
      <p>Mode: {webRuntime.phase} / {webRuntime.serviceMode}</p>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<AdminUsersApp />);
}