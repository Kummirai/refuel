const DEFAULT_TIMEOUT_MS = 15_000;

function timeoutSignal(ms = DEFAULT_TIMEOUT_MS): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url, { signal: timeoutSignal() });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
};

export const fetcherWithInit = (init?: RequestInit) => async (url: string) => {
  const res = await fetch(url, {
    ...init,
    signal: init?.signal ?? timeoutSignal(),
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
};
