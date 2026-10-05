import { expectMswStillInControl, fetchGreeting, MOCKED, resetControllerChanges, runWorkerOnce, startMsw } from './msw';

it('keeps mocking after a dedicated Worker from a same-origin URL starts and terminates', () => {
  startMsw();
  fetchGreeting().should('deep.equal', MOCKED);
  resetControllerChanges();

  runWorkerOnce(new URL('./echo.worker.ts', import.meta.url));

  expectMswStillInControl();
});
