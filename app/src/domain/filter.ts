import type {
  AuditPile,
  Category,
  Formality,
  Mood,
  Occasion,
  Season,
  WardrobeItem,
  Weather,
} from './schema';
import { STYLE_LABELS, type StyleId } from './styles';
import { wearDates } from './wear';

/** What the catalogue is currently showing. Every field is optional. */
export interface WardrobeQuery {
  query?: string;
  categories?: readonly Category[];
  occasions?: readonly Occasion[];
  weather?: readonly Weather[];
  seasons?: readonly Season[];
  moods?: readonly Mood[];
  formality?: readonly Formality[];
  styles?: readonly StyleId[];
  audit?: readonly AuditPile[];
  tags?: readonly string[];
  /** Only pieces with no wear history. */
  unwornOnly?: boolean;
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** Lowercase and strip diacritics, so "café" finds "cafe". */
export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Everything a search should be able to hit. Missing optional fields simply
 * contribute nothing rather than throwing.
 */
export const itemSearchText = (item: WardrobeItem): string =>
  normalizeText(
    [
      text(item.name),
      text(item.color),
      text(item.colorHex),
      text(item.material),
      text(item.fitNotes),
      text(item.notes),
      text(item.care),
      text(item.category),
      text(item.formality),
      ...(item.tags ?? []),
      ...(item.occasions ?? []),
      ...(item.moods ?? []),
      ...(item.seasons ?? []),
      ...(item.weather ?? []),
      ...(item.styles ?? []).map((style) => STYLE_LABELS[style]),
    ]
      .filter((part) => part.length > 0)
      .join(' '),
  );

/** Every whitespace-separated token must appear somewhere on the item. */
export const matchesQuery = (item: WardrobeItem, query: string): boolean => {
  const needle = normalizeText(query).trim();
  if (needle.length === 0) return true;
  const haystack = itemSearchText(item);
  return needle.split(/\s+/).every((token) => haystack.includes(token));
};

const selectsAny = <T>(selected: readonly T[] | undefined, values: readonly T[] | undefined): boolean => {
  if (!selected || selected.length === 0) return true;
  if (!values || values.length === 0) return false;
  return selected.some((value) => values.includes(value));
};

const selects = <T>(selected: readonly T[] | undefined, value: T): boolean =>
  !selected || selected.length === 0 || selected.includes(value);

/** Facet logic: options inside one facet are OR, facets are AND. */
export const matchesFacets = (item: WardrobeItem, query: WardrobeQuery): boolean => {
  if (!selects(query.categories, item.category)) return false;
  if (!selects(query.formality, item.formality)) return false;
  if (!selectsAny(query.occasions, item.occasions)) return false;
  if (!selectsAny(query.weather, item.weather)) return false;
  if (!selectsAny(query.seasons, item.seasons)) return false;
  if (!selectsAny(query.moods, item.moods)) return false;
  if (!selectsAny(query.styles, item.styles)) return false;
  if (!selects(query.audit, item.audit ?? 'keep')) return false;
  if (!selectsAny(query.tags, item.tags)) return false;
  if (query.unwornOnly === true && wearDates(item).length > 0) return false;
  return true;
};

export const filterItems = (
  items: readonly WardrobeItem[],
  query: WardrobeQuery = {},
): WardrobeItem[] => {
  const search = typeof query.query === 'string' ? query.query : '';
  return items.filter((item) => matchesQuery(item, search) && matchesFacets(item, query));
};

/** How many narrowing choices are active, for the "clear filters" affordance. */
export const activeFilterCount = (query: WardrobeQuery): number => {
  let count = 0;
  if (typeof query.query === 'string' && query.query.trim().length > 0) count += 1;
  count += query.categories?.length ?? 0;
  count += query.occasions?.length ?? 0;
  count += query.weather?.length ?? 0;
  count += query.seasons?.length ?? 0;
  count += query.moods?.length ?? 0;
  count += query.formality?.length ?? 0;
  count += query.styles?.length ?? 0;
  count += query.audit?.length ?? 0;
  count += query.tags?.length ?? 0;
  if (query.unwornOnly === true) count += 1;
  return count;
};

export interface TagUse {
  tag: string;
  count: number;
}

/** Outfit tags with how many pieces carry each one, most used first. */
export const tagIndex = (items: readonly WardrobeItem[]): TagUse[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      const label = tag.trim();
      if (label.length === 0) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => (b.count === a.count ? collator.compare(a.tag, b.tag) : b.count - a.count));
};

export const toggleValue = <T>(values: readonly T[] | undefined, value: T): T[] => {
  const current = [...(values ?? [])];
  const index = current.indexOf(value);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(value);
  }
  return current;
};
