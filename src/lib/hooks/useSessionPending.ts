"use client";

import { useEffect, useState } from "react";

/**
 * Bounds how long a screen may stay in a blocking state. A stalled session or
 * data request (poor mobile network, resumed PWA, cold backend) would
 * otherwise leave the flag true forever and the screen on a spinner.
 */
export function useBoundedFlag(active: boolean, timeoutMs = 2500) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setExpired(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [active, timeoutMs]);

  return active && !expired;
}

export function useSessionPending(isPending: boolean, timeoutMs = 2500) {
  return useBoundedFlag(isPending, timeoutMs);
}
