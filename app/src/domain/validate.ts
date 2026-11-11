import {
  isAuditPile,
  isCategory,
  isFormality,
  isMood,
  isOccasion,
  isSeason,
  isWeather,
  type AuditPile,
  type WardrobeItem,
} from './schema';
import { isStyle } from './styles';
import { parseDay } from '../lib/date';

export interface ValidationIssue {
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; item: WardrobeItem }
  | { ok: false; issues: ValidationIssue[] };

const MAX_TEXT = 240;
const MAX_NOTES = 2000;

const readText = (
  raw: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
  options: { required?: boolean; max?: number } = {},
): string | undefined => {
  const value = raw[field];
  if (value === undefined || value === null || value === '') {
    if (options.required) issues.push({ field, message: `${field} is required.` });
    return undefined;
  }
  if (typeof value !== 'string') {
    issues.push({ field, message: `${field} must be text.` });
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    if (options.required) issues.push({ field, message: `${field} is required.` });
    return undefined;
  }
  const max = options.max ?? MAX_TEXT;
  if (trimmed.length > max) {
    issues.push({ field, message: `${field} must be ${max} characters or fewer.` });
    return undefined;
  }
  return trimmed;
};

const readList = <T extends string>(
  raw: Record<string, unknown>,
  field: string,
  guard: (value: unknown) => value is T,
  issues: ValidationIssue[],
): T[] | undefined => {
  const value = raw[field];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    issues.push({ field, message: `${field} must be a list.` });
    return undefined;
  }
  const result: T[] = [];
  for (const entry of value) {
    if (!guard(entry)) {
      issues.push({ field, message: `${field} contains an unsupported value: ${String(entry)}.` });
      continue;
    }
    if (!result.includes(entry)) result.push(entry);
  }
  return result.length === 0 ? undefined : result;
};

const readTags = (raw: Record<string, unknown>, issues: ValidationIssue[]): string[] | undefined => {
  const value = raw['tags'];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    issues.push({ field: 'tags', message: 'tags must be a list of short labels.' });
    return undefined;
  }
  const tags: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      issues.push({ field: 'tags', message: 'Every tag must be text.' });
      continue;
    }
    const tag = entry.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag.length === 0) continue;
    if (tag.length > 40) {
      issues.push({
        field: 'tags',
        message: `Tag "${tag.slice(0, 24)}..." is longer than 40 characters.`,
      });
      continue;
    }
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags.length === 0 ? undefined : tags;
};

const readWearLog = (
  raw: Record<string, unknown>,
  issues: ValidationIssue[],
): string[] | undefined => {
  const value = raw['wearLog'];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    issues.push({ field: 'wearLog', message: 'wearLog must be a list of YYYY-MM-DD dates.' });
    return undefined;
  }
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string' || parseDay(entry) === null) {
      issues.push({
        field: 'wearLog',
        message: `"${String(entry)}" is not a valid YYYY-MM-DD date.`,
      });
      continue;
    }
    seen.add(entry.trim());
  }
  const dates = [...seen].sort((a, b) => (a < b ? 1 : -1));
  return dates.length === 0 ? undefined : dates;
};

// Local paths only. The production CSP allows images from this origin, and the
// privacy copy promises no third-party requests, so an https image would be
// blocked by the browser and contradict the promise.
const safeImagePath = (value: string): boolean => /^[a-z0-9][a-z0-9._/-]*$/i.test(value);

const readImage = (raw: Record<string, unknown>, issues: ValidationIssue[]): string | undefined => {
  const value = readText(raw, 'image', issues, { max: 400 });
  if (value === undefined) return undefined;
  if (!safeImagePath(value)) {
    issues.push({
      field: 'image',
      message: 'image must be a local relative path such as "media/shirt.jpg".',
    });
    return undefined;
  }
  return value;
};

const readColorHex = (raw: Record<string, unknown>, issues: ValidationIssue[]): string | undefined => {
  const value = readText(raw, 'colorHex', issues, { max: 7 });
  if (value === undefined) return undefined;
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    issues.push({ field: 'colorHex', message: 'colorHex must look like #1b1917.' });
    return undefined;
  }
  return value.toLowerCase();
};

const readPrice = (raw: Record<string, unknown>, issues: ValidationIssue[]): number | undefined => {
  const value = raw['price'];
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000) {
    issues.push({ field: 'price', message: 'price must be a number between 0 and 1,000,000.' });
    return undefined;
  }
  return Math.round(parsed * 100) / 100;
};

const readCore = (raw: Record<string, unknown>, issues: ValidationIssue[]): boolean | undefined => {
  const value = raw['core'];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    issues.push({ field: 'core', message: 'core must be true or false.' });
    return undefined;
  }
  return value;
};

const readAudit = (raw: Record<string, unknown>, issues: ValidationIssue[]): AuditPile | undefined => {
  const value = raw['audit'];
  if (value === undefined || value === null || value === '') return undefined;
  if (!isAuditPile(value)) {
    issues.push({ field: 'audit', message: 'audit must be keep, alter, donate or sell.' });
    return undefined;
  }
  return value;
};

const slug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'item';

/**
 * Validates one untrusted record (a file or localStorage entry) into the schema.
 * Required: name, category, color, material, formality. Unknown keys are dropped
 * so nothing unexpected reaches the UI or the saved file.
 */
export const validateWardrobeItem = (raw: unknown): ValidationResult => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, issues: [{ field: 'item', message: 'Each item must be an object.' }] };
  }
  const record = raw as Record<string, unknown>;
  const issues: ValidationIssue[] = [];

  const name = readText(record, 'name', issues, { required: true });
  const color = readText(record, 'color', issues, { required: true });
  const material = readText(record, 'material', issues, { required: true });
  const category = record['category'];
  const formality = record['formality'];

  if (!isCategory(category)) {
    issues.push({
      field: 'category',
      message: 'category must be tops, bottoms, outerwear, dresses, shoes or accessories.',
    });
  }
  if (!isFormality(formality)) {
    issues.push({
      field: 'formality',
      message: 'formality must be casual, smart-casual, business or formal.',
    });
  }

  const fitNotes = readText(record, 'fitNotes', issues);
  const care = readText(record, 'care', issues);
  const notes = readText(record, 'notes', issues, { max: MAX_NOTES });
  const image = readImage(record, issues);
  const colorHex = readColorHex(record, issues);
  const seasons = readList(record, 'seasons', isSeason, issues);
  const weather = readList(record, 'weather', isWeather, issues);
  const occasions = readList(record, 'occasions', isOccasion, issues);
  const moods = readList(record, 'moods', isMood, issues);
  const styles = readList(record, 'styles', isStyle, issues);
  const core = readCore(record, issues);
  const price = readPrice(record, issues);
  const audit = readAudit(record, issues);
  const tags = readTags(record, issues);
  const wearLog = readWearLog(record, issues);
  const idRaw = readText(record, 'id', issues, { max: 64 });

  if (issues.length > 0) return { ok: false, issues };
  if (!isCategory(category) || !isFormality(formality)) {
    return { ok: false, issues: [{ field: 'category', message: 'category is required.' }] };
  }
  if (name === undefined || color === undefined || material === undefined) {
    return { ok: false, issues: [{ field: 'name', message: 'name, color and material are required.' }] };
  }

  const item: WardrobeItem = {
    id: idRaw === undefined ? slug(name) : slug(idRaw),
    name,
    category,
    color,
    material,
    formality,
  };

  if (colorHex !== undefined) item.colorHex = colorHex;
  if (fitNotes !== undefined) item.fitNotes = fitNotes;
  if (care !== undefined) item.care = care;
  if (notes !== undefined) item.notes = notes;
  if (image !== undefined) item.image = image;
  if (seasons !== undefined) item.seasons = seasons;
  if (weather !== undefined) item.weather = weather;
  if (occasions !== undefined) item.occasions = occasions;
  if (moods !== undefined) item.moods = moods;
  if (styles !== undefined) item.styles = styles;
  if (core !== undefined) item.core = core;
  if (price !== undefined) item.price = price;
  if (audit !== undefined) item.audit = audit;
  if (tags !== undefined) item.tags = tags;
  if (wearLog !== undefined) item.wearLog = wearLog;
  if (record['example'] === true) item.example = true;

  return { ok: true, item };
};

export interface WardrobeFile {
  items: WardrobeItem[];
  issues: ValidationIssue[];
  skipped: number;
}

/** Accepts `{ items: [...] }` or a bare list, and keeps the valid records. */
export const validateWardrobeFile = (raw: unknown): WardrobeFile => {
  const source = Array.isArray(raw)
    ? raw
    : raw !== null && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : null;

  if (source === null) {
    return {
      items: [],
      issues: [{ field: 'file', message: 'Expected an object with an "items" list.' }],
      skipped: 0,
    };
  }

  const items: WardrobeItem[] = [];
  const issues: ValidationIssue[] = [];
  const usedIds = new Set<string>();
  let skipped = 0;

  source.forEach((entry, index) => {
    const result = validateWardrobeItem(entry);
    if (!result.ok) {
      skipped += 1;
      for (const issue of result.issues) {
        issues.push({ field: `items[${index}].${issue.field}`, message: issue.message });
      }
      return;
    }
    let id = result.item.id;
    if (usedIds.has(id)) {
      let suffix = 2;
      while (usedIds.has(`${id}-${suffix}`)) suffix += 1;
      id = `${id}-${suffix}`;
    }
    usedIds.add(id);
    items.push({ ...result.item, id });
  });

  return { items, issues, skipped };
};
