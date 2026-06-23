declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export function getApiUrl(): string {
  return (
    window.__APP_CONFIG__?.apiUrl ||
    import.meta.env.VITE_API_URL ||
    '/api/v1'
  );
}
