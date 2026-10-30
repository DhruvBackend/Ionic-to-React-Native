// Debug-only deep links, used by Maestro flows and the parity screenshots to open any screen in any
// state: topbathrn://open?screen=<Name>&role=<Role>&lang=<code>
//                         &variant=<endpoint:variant,...>&params=<url-encoded JSON>
// Only debug builds act on them (src/config/buildInfo.ts) (and the scheme is only registered in the debug manifest).
export interface DebugLink {
  screen: string;
  role?: string;
  lang?: string;
  variants: Record<string, string>;
  params: Record<string, unknown>;
}

const PREFIX = 'topbathrn://open';

export function parseDebugLink(url: string, opts: { dev: boolean }): DebugLink | null {
  if (!opts.dev || !url.startsWith(PREFIX)) {
    return null;
  }
  const query: Record<string, string> = {};
  const qs = url.slice(PREFIX.length).replace(/^\?/, '');
  for (const pair of qs ? qs.split('&') : []) {
    const eq = pair.indexOf('=');
    const key = decodeURIComponent(eq < 0 ? pair : pair.slice(0, eq));
    query[key] = eq < 0 ? '' : decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
  }
  if (!query.screen) {
    return null;
  }

  let params: Record<string, unknown> = {};
  if (query.params) {
    try {
      params = JSON.parse(query.params);
    } catch {
      return null;
    }
  }

  // Endpoints contain "/" but never ":", so the last ":" separates the variant name.
  const variants: Record<string, string> = {};
  for (const item of query.variant ? query.variant.split(',') : []) {
    const i = item.lastIndexOf(':');
    if (i > 0) {
      variants[item.slice(0, i)] = item.slice(i + 1);
    }
  }

  const link: DebugLink = { screen: query.screen, variants, params };
  if (query.role) {
    link.role = query.role;
  }
  if (query.lang) {
    link.lang = query.lang;
  }
  return link;
}
