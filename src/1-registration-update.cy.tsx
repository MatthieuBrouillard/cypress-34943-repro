import { expectMswStillInControl, fetchGreeting, MOCKED, resetControllerChanges, startMsw } from './msw';

it('keeps mocking after registration.update() (service worker script unchanged)', () => {
  startMsw();
  fetchGreeting().should('deep.equal', MOCKED);
  resetControllerChanges();

  cy.then(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/');
    await registration!.update();
  });

  expectMswStillInControl();
});
