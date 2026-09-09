export function isValidBlockPattern(p: string): string | null {
  const v = p.trim();
  if (!v) return 'Pattern is required.';
  if (v.length > 500) return 'Pattern is too long (max 500 chars).';
  if (/[<>"'`]/.test(v)) return 'Pattern contains invalid characters.';
  if (v.startsWith('http')) {
    try {
      new URL(v);
    } catch {
      return 'Invalid URL.';
    }
  }
  return null;
}

export function isValidNotify(title: string, message: string): string | null {
  const t = title.trim();
  const m = message.trim();
  if (!m) return 'Message is required.';
  if (t.length > 100) return 'Title too long (max 100 chars).';
  if (m.length > 250) return 'Message too long (max 250 chars).';
  if (/[<>]/.test(t) || /[<>]/.test(m)) return 'Angle brackets are not allowed.';
  return null;
}

export function isValidQuota(domain: string, minutes: number): string | null {
  const d = domain.trim().toLowerCase();
  if (!d) return 'Domain is required.';
  if (d.length > 253) return 'Domain too long.';
  if (/[<>"'`\s/]/.test(d)) return 'Enter a plain domain, e.g. youtube.com (no spaces, slashes or http).';
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) return 'Minutes must be 1–1440.';
  return null;
}

export function isValidCloseUrl(u: string): string | null {
  const v = u.trim();
  if (!v) return 'URL or domain is required.';
  if (v.length > 2000) return 'Value is too long.';
  if (/[<>"'`]/.test(v)) return 'Value contains invalid characters.';
  return null;
}
