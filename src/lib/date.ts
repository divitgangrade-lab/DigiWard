/** Calendar-day helpers. Every wear date in the app is a local calendar day. */

export const DAY_MS = 86_400_000;

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a YYYY-MM-DD string into a UTC timestamp at midnight.
 * Returns null for anything malformed, including impossible dates such as
 * 2026-02-31, so imported files cannot poison wear calculations.
 */
export const parseDay = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = ISO_DAY.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined) return null;
  const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return timestamp;
};

/** The UTC-midnight timestamp for a local calendar day. */
export const startOfDay = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

/** Formats a timestamp (or Date) as YYYY-MM-DD. */
export const formatDay = (value: Date | number): string => {
  const date = typeof value === 'number' ? new Date(value) : value;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Today's local calendar day as YYYY-MM-DD. */
export const todayKey = (today: Date = new Date()): string => formatDay(startOfDay(today));

/** Whole days from `from` to `to`; both are UTC-midnight timestamps. */
export const daysBetween = (from: number, to: number): number => Math.round((to - from) / DAY_MS);

export const isoDaysAgo = (days: number, today: Date = new Date()): string =>
  formatDay(startOfDay(today) - Math.max(0, Math.round(days)) * DAY_MS);

/** "3 days ago", "yesterday", "today": used in the wear log. */
export const describeDaysAgo = (days: number): string => {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 60) return 'over a month ago';
  const months = Math.round(days / 30);
  return `${months} months ago`;
};

export const formatDisplayDate = (value: string): string => {
  const timestamp = parseDay(value);
  if (timestamp === null) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(timestamp));
};
