import { useCallback } from "react";

const BASE = typeof window !== "undefined" ? window.location.origin : "";

export function useAuthenticatedFetch() {
  return useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
      const token = localStorage.getItem("unify_auth_token");
      const headers = new Headers(init.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const url = typeof input === "string" && input.startsWith("/")
        ? `${BASE}${input}`
        : input;
      return fetch(url, { ...init, headers });
    },
    [],
  );
}
