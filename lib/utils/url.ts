export interface NormalizedPageUrl {
  /** Canonical form, including protocol — used to fetch and to recognise a repeat scan. */
  url: string;
  /** Display form: host + path, no protocol. */
  label: string;
}

export function normalizePageUrl(input: string): NormalizedPageUrl | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return undefined;
  }
  if (!parsed.hostname.includes(".")) return undefined;

  let path = parsed.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  return {
    url: `${parsed.protocol}//${parsed.host}${path}${parsed.search}`,
    label: `${parsed.host}${path === "/" ? "" : path}${parsed.search}`,
  };
}
