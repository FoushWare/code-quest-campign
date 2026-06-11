/*
  tools/scripts/cleanup-local-dev.mjs

  Utility to kill processes listening on known dev ports. Use this when you hit
  `EADDRINUSE` errors while running multiple dev servers locally.

  Note: uses `lsof` and `process.kill` (SIGTERM). On macOS this works out of the box.
  If you prefer a more aggressive kill, modify to use SIGKILL; keep caution when
  killing production processes.
*/

import { execSync } from 'node:child_process';

// Ports used by hosts, MFEs and local Go services. Keep this list in sync with
// package.json serve scripts and `tools/scripts/generate-web-runtime.mjs`.
const ports = [
  4200, // website host
  4201, // shell host
  4202, // admin host
  // website MFEs
  4210, 4211, 4212, 4213, 4214,
  // admin MFEs
  4220, 4221, 4222, 4223,
  // services
  8080, 8081, 8082, 8083, 8084,
];

for (const port of ports) {
  try {
    const output = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).trim();

    if (!output) {
      continue;
    }

    for (const pid of output.split(/\s+/)) {
      // polite termination first
      process.kill(Number(pid), 'SIGTERM');
    }
  } catch {
    // ignore errors — not all systems have `lsof` or there may be no listener
    continue;
  }
}
