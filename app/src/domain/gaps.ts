import type { WardrobeQuery } from './filter';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_SINGULAR,
  FORMALITY,
  FORMALITY_LABELS,
  OCCASIONS,
  OCCASION_LABELS,
  SEASONS,
  SEASON_LABELS,
  WEATHER,
  WEATHER_LABELS,
  type WardrobeItem,
} from './schema';

export type GapSeverity = 'critical' | 'notice';

export interface CollectionGap {
  id: string;
  kind: 'category' | 'occasion' | 'weather' | 'season' | 'formality';
  label: string;
  count: number;
  severity: GapSeverity;
  detail: string;
  /** Ready-made query so the catalogue can show the pieces involved. */
  filter: WardrobeQuery;
}

export interface GapOptions {
  /** Below this many pieces a category is treated as thin. Default 2. */
  minimumPerCategory?: number;
}

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/**
 * Reads the catalogue and reports what it cannot cover: empty categories,
 * occasions with nothing tagged, weather and seasons with no options, and
 * formalities with a single piece. It never invents items and never assumes a
 * climate, so weather gaps are reported as notices to check, not verdicts.
 */
export const findGaps = (
  items: readonly WardrobeItem[],
  options: GapOptions = {},
): CollectionGap[] => {
  const minimum = Math.max(1, options.minimumPerCategory ?? 2);
  const gaps: CollectionGap[] = [];

  for (const category of CATEGORIES) {
    const count = items.filter((item) => item.category === category).length;
    if (count === 0) {
      gaps.push({
        id: `category-${category}`,
        kind: 'category',
        label: CATEGORY_LABELS[category],
        count,
        severity: 'critical',
        detail: `No ${CATEGORY_LABELS[category]} catalogued yet.`,
        filter: { categories: [category] },
      });
    } else if (count < minimum) {
      gaps.push({
        id: `category-${category}`,
        kind: 'category',
        label: CATEGORY_LABELS[category],
        count,
        severity: 'notice',
        detail: `Only one ${CATEGORY_SINGULAR[category]}. A second keeps laundry day from stalling a rotation.`,
        filter: { categories: [category] },
      });
    }
  }

  for (const occasion of OCCASIONS) {
    const count = items.filter((item) => item.occasions?.includes(occasion)).length;
    if (count === 0) {
      gaps.push({
        id: `occasion-${occasion}`,
        kind: 'occasion',
        label: OCCASION_LABELS[occasion],
        count,
        severity: 'critical',
        detail: `Nothing is tagged for ${OCCASION_LABELS[occasion]}. Outfit suggestions for it will come back empty.`,
        filter: { occasions: [occasion] },
      });
    } else if (count < 3) {
      gaps.push({
        id: `occasion-${occasion}`,
        kind: 'occasion',
        label: OCCASION_LABELS[occasion],
        count,
        severity: 'notice',
        detail: `${count} ${plural(count, 'item is', 'items are')} tagged for ${OCCASION_LABELS[occasion]}. Thin cover for a recurring occasion.`,
        filter: { occasions: [occasion] },
      });
    }
  }

  for (const weather of WEATHER) {
    const count = items.filter((item) => item.weather?.includes(weather)).length;
    if (count === 0) {
      gaps.push({
        id: `weather-${weather}`,
        kind: 'weather',
        label: WEATHER_LABELS[weather],
        count,
        severity: 'notice',
        detail: `Nothing is tagged for ${WEATHER_LABELS[weather]} weather. Check this against your own climate before buying.`,
        filter: { weather: [weather] },
      });
    }
  }

  for (const season of SEASONS) {
    const count = items.filter((item) => item.seasons?.includes(season)).length;
    if (count === 0) {
      gaps.push({
        id: `season-${season}`,
        kind: 'season',
        label: SEASON_LABELS[season],
        count,
        severity: 'notice',
        detail: `No pieces are tagged for ${SEASON_LABELS[season]}.`,
        filter: { seasons: [season] },
      });
    }
  }

  for (const formality of FORMALITY) {
    const count = items.filter((item) => item.formality === formality).length;
    if (count === 0) {
      gaps.push({
        id: `formality-${formality}`,
        kind: 'formality',
        label: FORMALITY_LABELS[formality],
        count,
        severity: 'critical',
        detail: `Nothing sits at ${FORMALITY_LABELS[formality]} level.`,
        filter: { formality: [formality] },
      });
    } else if (count < 2) {
      gaps.push({
        id: `formality-${formality}`,
        kind: 'formality',
        label: FORMALITY_LABELS[formality],
        count,
        severity: 'notice',
        detail: `One ${FORMALITY_LABELS[formality]} piece only, so one spill or one repair leaves you without an option.`,
        filter: { formality: [formality] },
      });
    }
  }

  return gaps.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    if (a.count !== b.count) return a.count - b.count;
    return a.id.localeCompare(b.id);
  });
};

export interface CoverageRow {
  label: string;
  count: number;
}

export interface CoverageSummary {
  byCategory: CoverageRow[];
  byFormality: CoverageRow[];
  byOccasion: CoverageRow[];
  byWeather: CoverageRow[];
}

/** Counts for the coverage strip. Every catalogue value appears, even at zero. */
export const coverageSummary = (items: readonly WardrobeItem[]): CoverageSummary => {
  const countWhere = (predicate: (item: WardrobeItem) => boolean): number =>
    items.filter(predicate).length;

  return {
    byCategory: CATEGORIES.map((category) => ({
      label: CATEGORY_LABELS[category],
      count: countWhere((item) => item.category === category),
    })),
    byFormality: FORMALITY.map((formality) => ({
      label: FORMALITY_LABELS[formality],
      count: countWhere((item) => item.formality === formality),
    })),
    byOccasion: OCCASIONS.map((occasion) => ({
      label: OCCASION_LABELS[occasion],
      count: countWhere((item) => item.occasions?.includes(occasion) ?? false),
    })),
    byWeather: WEATHER.map((weather) => ({
      label: WEATHER_LABELS[weather],
      count: countWhere((item) => item.weather?.includes(weather) ?? false),
    })),
  };
};
