export function encodeEmail(email: string): string {
  return btoa(email)  // `btoa` działa w przeglądarce
    .replace(/\+/g, '-')  // zamiana na URL-safe
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeEmail(encoded: string): string {
  // Przywracamy padding (=) i znaki
  const normalized = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(encoded.length + (4 - (encoded.length % 4)) % 4, '=');

  return atob(normalized);  // `atob` działa w przeglądarce
}
