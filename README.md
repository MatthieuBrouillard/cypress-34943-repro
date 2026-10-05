# Repro: Cypress 16.1 replaces an unchanged service worker, so MSW stops mocking

Reproduction for [cypress-io/cypress#34943](https://github.com/cypress-io/cypress/issues/34943).

Component testing, Vite 8, React, MSW 2.15.

## Run

```sh
pnpm install   # or npm install
pnpm test      # runs each spec in its own `cypress run --component --browser chrome`
```

Compare with Cypress 15.16.0:

```sh
pnpm add -D cypress@15.16.0
pnpm test
```

`pnpm test` runs each spec in a separate `cypress run`. Each run starts with a fresh browser profile, so no
service worker is registered when a spec starts. Do not run all specs in one `cypress run`:

- MSW's `worker.start()` calls `registration.update()` when a registration already exists. On 16.1.0, that makes the
  start of each later spec a trigger too, and the results depend on spec order.
- On 15.16.0, the third spec in one run also loses mocking, whatever that spec does (the control spec too), and no
  `controllerchange` event fires. This is a different effect. It does not occur when each spec runs alone.

## Specs

Each spec registers MSW with scope `/` and checks that `GET /api/greeting` is mocked. Then it fires one trigger,
waits 3 s, and requests again. The check expects a mocked response and no `controllerchange` event since the trigger.

| Spec                           | Trigger                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1-registration-update.cy.tsx` | `registration.update()`. The service worker script is not changed.                                                                                         |
| `2-dedicated-worker.cy.tsx`    | `new Worker(new URL('./echo.worker.ts', import.meta.url), { type: 'module' })`, wait for its reply, then `terminate()`. Chrome runs an update check about 1 s later. |
| `3-no-trigger-control.cy.tsx`  | None (control).                                                                                                                                            |

## Result

macOS, Chrome 154 headless, Node 24.14, Vite 8.3.0, MSW 2.15.0. The same result in every run.

| Cypress | 1-registration-update | 2-dedicated-worker | 3-no-trigger-control |
| ------- | --------------------- | ------------------ | -------------------- |
| 15.16.0 | pass                  | pass               | pass                 |
| 16.1.0  | **fail**              | **fail**           | pass                 |

Failure on 16.1.0:

```
- { greeting: { status: 404, body: 'The server is configured with a public base URL of /__cypress/src/ - did you mean to visit /__cypress/src/api/greeting instead?' }, controllerChangesSinceTrigger: 1 }
+ { greeting: { status: 200, body: '{"greeting":"mocked"}' }, controllerChangesSinceTrigger: 0 }
```

On 16.1.0, the update check installs and activates a new service worker version, although the script did not change.
The MSW script calls `skipWaiting()` and `clients.claim()`, so the new version takes control of the page
(`controllerchange`). The new version does not know that the page enabled mocking. The request goes to the Vite dev
server, which returns 404.

On 15.16.0, the update check finds the same script and does not install a new version.

## Notes

- `vite.config.ts` serves `mockServiceWorker.js` at `/`. A scope of `/` is necessary to control the spec iframe
  (`/__cypress/iframes/...`). Vite serves its public dir under `/__cypress/src/`.
- Workaround for trigger 2: start the worker from a `blob:` URL that imports the original script. A `blob:` load is
  not a service worker fetch, so Chrome does not run an update check. This does not help trigger 1.

  ```ts
  const bootstrap = new Blob([`import ${JSON.stringify(scriptUrl)};`], { type: 'text/javascript' });
  new Worker(URL.createObjectURL(bootstrap), { type: 'module' });
  ```
