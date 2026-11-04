// CSS `text-transform` applied to the string itself. Android's Text with `textTransform` can measure the line
// narrower than it draws it and clip the last letters (Home "Today" -> "Toda", phone pass 2026-11-04), so
// screens that hit this transform the text in JS instead of using the style.
// `capitalize`: the first letter of every whitespace-separated word goes upper case; the rest is kept (CSS keeps it too).
export function cssCapitalize(value: string): string {
  return value.replace(/(^|\s)([^\p{L}\p{N}\s]*)(\p{L})/gu, (_m, sp: string, punct: string, ch: string) => sp + punct + ch.toUpperCase());
}
