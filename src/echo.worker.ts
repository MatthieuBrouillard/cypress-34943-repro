self.onmessage = (event: MessageEvent) => {
  self.postMessage(event.data === 'ping' ? 'pong' : event.data);
};
