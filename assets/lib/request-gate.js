export function createRequestGate() {
  let latestRequest = 0;

  return {
    begin() {
      latestRequest += 1;
      return latestRequest;
    },
    isCurrent(request) {
      return request === latestRequest;
    },
    runIfCurrent(request, action) {
      if (!this.isCurrent(request)) return false;
      action();
      return true;
    },
  };
}
