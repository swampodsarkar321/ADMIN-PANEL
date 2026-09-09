/** Escape a string for safe HTML rendering (when using dangerouslySetInnerHTML). */
export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Truncate long URLs for display; full value stays in `title` attr. */
export function shortUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + '…';
}
