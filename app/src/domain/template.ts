import type { WardrobeItem } from './schema';

export type FieldImportance = 'fill first' | 'improves suggestions' | 'optional';

export interface FieldGuideEntry {
  field: keyof WardrobeItem;
  label: string;
  importance: FieldImportance;
  why: string;
}

/**
 * The field order the form uses, and the honest answer to "what do I fill in
 * first?". The `fill first` set is exactly what outfit filtering needs; without
 * it the catalogue can still be browsed, but occasion, weather and mood
 * suggestions go thin.
 */
export const FIELD_GUIDE: readonly FieldGuideEntry[] = [
  {
    field: 'name',
    label: 'Name',
    importance: 'fill first',
    why: 'What you would call it out loud. It is the main thing you search.',
  },
  {
    field: 'category',
    label: 'Category',
    importance: 'fill first',
    why: 'Tops, bottoms, outerwear, dresses, shoes, accessories. Drives the gap report.',
  },
  {
    field: 'color',
    label: 'Colour',
    importance: 'fill first',
    why: 'Plain words beat hex codes for search: "oxblood" is findable, "#7a2b25" is not.',
  },
  {
    field: 'formality',
    label: 'Formality',
    importance: 'fill first',
    why: 'The quickest way to rule an item out of an outfit for work or a formal event.',
  },
  {
    field: 'occasions',
    label: 'Occasions',
    importance: 'fill first',
    why: 'Work, weekend, evening, formal event, outdoors, travel. Powers the occasion filter.',
  },
  {
    field: 'weather',
    label: 'Weather',
    importance: 'fill first',
    why: 'Hot, mild, cool, cold, wet, windy. This is the filter that stops bad mornings.',
  },
  {
    field: 'moods',
    label: 'Mood',
    importance: 'fill first',
    why: 'Minimal, classic, relaxed, sharp, cozy, expressive. How you want to feel in it.',
  },
  {
    field: 'fitNotes',
    label: 'Fit notes',
    importance: 'improves suggestions',
    why: 'Sleeve length, rise, shrinkage, "runs small". Saves you repeating the same mistake.',
  },
  {
    field: 'material',
    label: 'Material',
    importance: 'improves suggestions',
    why: 'Cotton, merino, waxed cotton. Explains why something is warm, shiny or rainproof.',
  },
  {
    field: 'seasons',
    label: 'Seasons',
    importance: 'improves suggestions',
    why: 'Broader than weather, and useful for packing and storage.',
  },
  {
    field: 'tags',
    label: 'Outfit tags',
    importance: 'improves suggestions',
    why: 'Group pieces into outfit combinations: "winter-evening", "desk-uniform".',
  },
  {
    field: 'wearLog',
    label: 'Wear log',
    importance: 'improves suggestions',
    why: 'Filled in by the "Wore it today" button. Drives the even-rotation queue.',
  },
  {
    field: 'colorHex',
    label: 'Swatch',
    importance: 'optional',
    why: 'Makes the catalogue readable at a glance. Does not affect filtering.',
  },
  { field: 'care', label: 'Care', importance: 'optional', why: 'Wash instructions worth remembering.' },
  { field: 'notes', label: 'Notes', importance: 'optional', why: 'Anything else: where it came from, repairs owed.' },
  { field: 'image', label: 'Image', importance: 'optional', why: 'A photo path if you keep one.' },
];

export const FILL_FIRST_FIELDS = FIELD_GUIDE.filter((entry) => entry.importance === 'fill first').map(
  (entry) => entry.field,
);

/** A populated skeleton: every field present, ready for the user to overwrite. */
export const BLANK_ITEM: WardrobeItem = {
  id: 'item-001',
  name: 'Replace with the garment name',
  category: 'tops',
  color: 'Replace with the colour',
  colorHex: '#8a8177',
  material: 'Replace with the fibre or weave',
  formality: 'casual',
  fitNotes: 'Sleeve, rise, shoulders, and anything that runs small.',
  seasons: ['spring'],
  weather: ['mild'],
  occasions: ['weekend'],
  moods: ['relaxed'],
  tags: ['outfit-tag'],
  wearLog: [],
  care: 'Wash instructions.',
  notes: 'Anything worth remembering.',
  example: false,
};

export const TEMPLATE_README = [
  'Copy one object per garment. Required: name, category, color, material, formality.',
  'Valid categories: tops, bottoms, outerwear, dresses, shoes, accessories.',
  'Valid formality: casual, smart-casual, business, formal.',
  'Valid weather: hot, mild, cool, cold, wet, windy. Valid moods: minimal, classic, relaxed, sharp, cozy, expressive.',
  'Wear dates are calendar days in YYYY-MM-DD form. Tags are lowercase slugs that group pieces into outfits.',
  'Files with mistakes are imported partially: the app lists every item it skipped and why.',
];

export const templateFields = (): Record<string, FieldImportance> =>
  Object.fromEntries(FIELD_GUIDE.map((entry) => [entry.field, entry.importance]));
