// Routes cross-origin API calls through the local dev-server proxy to bypass CORS.
// Most relay/proxy API providers (中转站) do not send CORS headers, so direct browser calls
// fail with "Failed to fetch". The Vite dev server middleware at /api-proxy forwards the
// request server-side, where there is no same-origin restriction.
// Production builds keep direct browser calls.
export function proxyApiUrl(directUrl: string): string {
    if (!import.meta.env.DEV) return directUrl;
    try {
        const target = new URL(directUrl);
        if (target.origin === window.location.origin) return directUrl;
        return `/api-proxy?target=${encodeURIComponent(directUrl)}`;
    } catch {
        return directUrl;
    }
}
