import { addDays, parseIsoDate, todayIso, toIsoDate } from '@/lib/trips/dates';

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function currentYear(): number {
  return Number(todayIso().slice(0, 4));
}

export function parseLooseDate(value: string, year = currentYear()): string | null {
  const trimmed = value.trim();
  const iso = parseIsoDate(trimmed);
  if (iso) return toIsoDate(iso);

  const monthFirst = /^([A-Za-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/.exec(trimmed);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()];
    const day = Number(monthFirst[2]);
    const y = monthFirst[3] ? Number(monthFirst[3]) : year;
    if (!month || day < 1 || day > 31) return null;
    return parseIsoDate(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
      ? `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : null;
  }

  const dayFirst = /^(\d{1,2})\s+([A-Za-z]+)(?:,?\s*(\d{4}))?$/.exec(trimmed);
  if (dayFirst) {
    return parseLooseDate(`${dayFirst[2]} ${dayFirst[1]}${dayFirst[3] ? ` ${dayFirst[3]}` : ''}`, year);
  }
  return null;
}

export function parseRelativeDay(text: string): string | null {
  const lower = text.toLowerCase();
  const today = parseIsoDate(todayIso());
  if (!today) return null;
  if (/\btomorrow\b/.test(lower)) return toIsoDate(addDays(today, 1));
  if (/\btoday\b/.test(lower)) return todayIso();
  return null;
}

export function parseDateRange(text: string): { startDate: string; endDate: string } | null {
  const match =
    /([A-Za-z]+\s+\d{1,2}|\d{1,2}\s+[A-Za-z]+|\d{4}-\d{2}-\d{2})\s*(?:to|-|–|—)\s*([A-Za-z]+\s+\d{1,2}|\d{1,2}\s+[A-Za-z]+|\d{4}-\d{2}-\d{2})(?:\s+(\d{4}))?/i.exec(
      text,
    );
  if (!match) return null;
  const year = match[3] ? Number(match[3]) : currentYear();
  const startDate = parseLooseDate(match[1], year);
  const endDate = parseLooseDate(match[2], year);
  if (!startDate || !endDate) return null;
  return { startDate, endDate };
}
