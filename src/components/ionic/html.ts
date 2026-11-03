// Ionic renders alert title/subTitle/message and loading content through innerHTML (alert-component.js,
// loading-component.js). The Topbath app only passes plain text (grep of src/pages), so tags are not interpreted:
// <br> becomes a line break, other tags are dropped and the common entities are decoded.
// The browser's `white-space: normal` also applies (Phase 2 kit, 2026-11-03, Pointtranfer review): runs of spaces,
// tabs and newlines collapse to one space, white space at the block edges and around a <br> disappears, and &nbsp;
// stays a non-collapsing U+00A0. So "You are account  not verified" shows ONE space, as in Ionic.
const WS = /[ \t\n\r\f]+/g;

export function stripHtml(html: string): string {
  return html
    .replace(WS, ' ')
    .replace(/ ?<br\s*\/?> ?/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/^ | $/g, '')
    .replace(/ ?\n ?/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
