import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

export const worker = setupWorker(http.get('/api/greeting', () => HttpResponse.json({ greeting: 'mocked' })));

export const controllerChanges: number[] = [];

/** Registers MSW (scope "/") and records every `controllerchange` after that. */
export const startMsw = () =>
  cy.then(async () => {
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
    navigator.serviceWorker.addEventListener('controllerchange', () => controllerChanges.push(performance.now()));
  });

/** Yields `{ status, body }` of GET /api/greeting. The MSW handler answers 200 `{"greeting":"mocked"}`; the Vite dev server answers 404. */
export const fetchGreeting = () =>
  cy.then(() => fetch('/api/greeting').then(async (res) => ({ status: res.status, body: await res.text() })));

export const MOCKED = { status: 200, body: '{"greeting":"mocked"}' };

/** Starts a dedicated module Worker, waits for its reply, then terminates it. */
export const runWorkerOnce = (url: string | URL) =>
  cy.then(
    () =>
      new Promise<void>((resolve) => {
        const w = new Worker(url, { type: 'module' });
        w.onmessage = () => {
          w.terminate();
          resolve();
        };
        w.postMessage('ping');
      }),
  );

/** Call right before the trigger, after a first mocked request proved MSW controls the page. */
export const resetControllerChanges = () => cy.then(() => (controllerChanges.length = 0));

export const expectMswStillInControl = () => {
  // Chrome runs its service worker update check about 1 s after the trigger; give it time to finish.
  cy.wait(3000);
  fetchGreeting()
    .then((greeting) => ({ greeting, controllerChangesSinceTrigger: controllerChanges.length }))
    .should('deep.equal', { greeting: MOCKED, controllerChangesSinceTrigger: 0 });
};
