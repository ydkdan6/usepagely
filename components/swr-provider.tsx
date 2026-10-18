"use client";
import { SWRConfig } from "swr";
export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 300000,
        focusThrottleInterval: 300000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
