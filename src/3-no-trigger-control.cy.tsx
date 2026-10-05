import { expectMswStillInControl, fetchGreeting, MOCKED, resetControllerChanges, startMsw } from './msw';

// Control: same steps as the other specs, without a trigger. Passes on 15.16.0 and 16.1.0.
it('keeps mocking when nothing triggers a service worker update check', () => {
  startMsw();
  fetchGreeting().should('deep.equal', MOCKED);
  resetControllerChanges();

  expectMswStillInControl();
});
