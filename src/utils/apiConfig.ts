/**
 * Konfigurasi URL API untuk Produksi dan Pengembangan
 * Menangani URL relatif (full-stack / Vercel serverless) maupun backend eksternal.
 * Mencegah duplikasi path '/api' dan menjamin protokol HTTPS pada produksi.
 */

export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

  // Jika tidak disetel, gunakan path relatif (sama dengan origin saat ini)
  if (!envUrl) {
    return '';
  }

  let sanitized = envUrl.replace(/\/+$/, '');

  // Jika mengarah ke AI Studio dev/pre URL atau localhost, abaikan dan gunakan origin Vercel/server saat ini
  if (
    sanitized.includes('ais-dev') ||
    sanitized.includes('ais-pre') ||
    sanitized.includes('localhost') ||
    sanitized.includes('127.0.0.1')
  ) {
    return '';
  }

  return sanitized;
}

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!base) {
    return cleanEndpoint;
  }

  // Jika base URL sudah mencakup '/api' dan endpoint diawali '/api', hapus duplikasi
  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${base}${cleanEndpoint.slice(4)}`;
  }

  return `${base}${cleanEndpoint}`;
}
