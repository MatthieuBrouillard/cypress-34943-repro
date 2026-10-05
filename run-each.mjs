// Runs each spec in its own `cypress run`, so every spec starts with no service worker registered.
// (In one run, a later spec's `worker.start()` finds the earlier registration and calls `update()`,
// which is itself a trigger on 16.1.0.)
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const { version } = createRequire(import.meta.url)('cypress/package.json');
const bin = process.platform === 'win32' ? 'node_modules\\.bin\\cypress.cmd' : 'node_modules/.bin/cypress';
const specs = readdirSync('src').filter((f) => f.endsWith('.cy.tsx')).sort();

const results = specs.map((spec) => {
  const { status } = spawnSync(bin, ['run', '--component', '--browser', 'chrome', '--spec', `src/${spec}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return { spec, result: status === 0 ? 'pass' : 'FAIL' };
});

console.log(`\nCypress ${version}`);
console.table(results);
