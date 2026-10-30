// Ionic renders alert title/subTitle/message and loading content through innerHTML. The Topbath app
// only passes plain text (grep of src/pages), so tags are not interpreted: <br> becomes a line break,
// other tags are dropped and the common entities are decoded.
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
