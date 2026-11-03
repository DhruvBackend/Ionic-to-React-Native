// Ported from: src/pages/home/home.ts:388-390 `moment(r.scan_date).format("D-M-Y")` (moment is not a dependency of the RN app).
// Matches moment for: undefined (= now), 'YYYY-MM-DD[ T]HH:mm[:ss]' without a zone (local time), ISO strings with Z / an offset
// (converted to local time), and unreadable or impossible dates ('0000-00-00 ...', null) -> 'Invalid date'.
export function formatScanDate(v: any): string {
  let d: Date;
  if (v === undefined) {
    d = new Date();
  } else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/.test(v.trim())) {
    const [y, mo, da] = v.trim().slice(0, 10).split('-').map(Number);
    d = new Date(y, mo - 1, da);
    if (mo < 1 || mo > 12 || d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) {
      return 'Invalid date';
    }
  } else if (v === null) {
    return 'Invalid date';
  } else {
    d = new Date(v);
  }
  return isNaN(d.getTime()) ? 'Invalid date' : `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}
