import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const mswScript = fileURLToPath(new URL('./node_modules/msw/lib/mockServiceWorker.js', import.meta.url));

// MSW must be registered with scope "/" so it controls the spec iframe (/__cypress/iframes/...).
// Vite serves its public dir under the Cypress base (/__cypress/src/), so serve the script at the root.
const mswAtRoot = (): Plugin => ({
  name: 'msw-at-root',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/mockServiceWorker.js') return next();
      res.setHeader('Content-Type', 'text/javascript');
      createReadStream(mswScript).pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [react(), mswAtRoot()],
});
