/**
 * The single item schema for DigiWard.
 *
 * One garment = one `WardrobeItem`. Outfit combinations are plain tags on the
 * item, and wear history is an array of ISO dates on the same record, so a
 * saved wardrobe is a single JSON list with nothing else to join.
 */

export const CATEGORIES = ['tops', 'bottoms', 'outerwear', 'dresses', 'shoes', 'accessories'] as const;
export type Category = (typeof CATEGORIES)[number];

export const OCCASIONS = ['work', 'weekend', 'evening', 'formal', 'outdoors', 'travel'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const WEATHER = ['hot', 'mild', 'cool', 'cold', 'wet', 'windy'] as const;
export type Weather = (typeof WEATHER)[number];

export const MOODS = ['minimal', 'classic', 'relaxed', 'sharp', 'cozy', 'expressive'] as const;
export type Mood = (typeof MOODS)[number];

export const FORMALITY = ['casual', 'smart-casual', 'business', 'formal'] as const;
export type Formality = (typeof FORMALITY)[number];

export const FORMALITY_RANK: Record<Formality, number> = {
  casual: 1,
  'smart-casual': 2,
  business: 3,
  formal: 4,
};

export interface WardrobeItem {
  /** Stable, unique, and safe to use as a DOM id fragment. */
  id: string;
  /** What you call it when you reach for it. "Heavyweight oxford shirt", not "Shirt 1". */
  name: string;
  category: Category;
  /** Plain-language colour: "ecru", "indigo wash", "oxblood". */
  color: string;
  /** Optional swatch so the catalogue reads as colour, not just words. */
  colorHex?: string;
  /** Fibre or weave: "cotton oxford", "merino wool", "waxed cotton". */
  material: string;
  formality: Formality;
  /** How it actually sits: shoulders, rise, sleeve and leg length, shrink notes. */
  fitNotes?: string;
  seasons?: Season[];
  weather?: Weather[];
  occasions?: Occasion[];
  moods?: Mood[];
  /** Outfit combinations this piece belongs to, e.g. "winter-evening". */
  tags?: string[];
  /** ISO calendar dates (YYYY-MM-DD), one entry per day worn. */
  wearLog?: string[];
  care?: string;
  notes?: string;
  /** Optional photo path or URL. Cards fall back to the colour swatch. */
  image?: string;
  /** True for the shipped sample entries, false for anything you add. */
  example?: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  tops: 'tops',
  bottoms: 'bottoms',
  outerwear: 'outerwear',
  dresses: 'dresses',
  shoes: 'shoes',
  accessories: 'accessories',
};

export const CATEGORY_SINGULAR: Record<Category, string> = {
  tops: 'top',
  bottoms: 'pair of trousers or a skirt',
  outerwear: 'outerwear piece',
  dresses: 'dress',
  shoes: 'pair of shoes',
  accessories: 'accessory',
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  work: 'work',
  weekend: 'weekend',
  evening: 'evening',
  formal: 'formal event',
  outdoors: 'outdoors',
  travel: 'travel',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  winter: 'winter',
};

export const WEATHER_LABELS: Record<Weather, string> = {
  hot: 'hot',
  mild: 'mild',
  cool: 'cool',
  cold: 'cold',
  wet: 'wet',
  windy: 'windy',
};

export const MOOD_LABELS: Record<Mood, string> = {
  minimal: 'minimal',
  classic: 'classic',
  relaxed: 'relaxed',
  sharp: 'sharp',
  cozy: 'cozy',
  expressive: 'expressive',
};

export const FORMALITY_LABELS: Record<Formality, string> = {
  casual: 'casual',
  'smart-casual': 'smart casual',
  business: 'business',
  formal: 'formal',
};

export const isCategory = (value: unknown): value is Category =>
  typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);

export const isOccasion = (value: unknown): value is Occasion =>
  typeof value === 'string' && (OCCASIONS as readonly string[]).includes(value);

export const isSeason = (value: unknown): value is Season =>
  typeof value === 'string' && (SEASONS as readonly string[]).includes(value);

export const isWeather = (value: unknown): value is Weather =>
  typeof value === 'string' && (WEATHER as readonly string[]).includes(value);

export const isMood = (value: unknown): value is Mood =>
  typeof value === 'string' && (MOODS as readonly string[]).includes(value);

export const isFormality = (value: unknown): value is Formality =>
  typeof value === 'string' && (FORMALITY as readonly string[]).includes(value);
