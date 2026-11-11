/**
 * Style categories and dress codes, kept separate from `formality`.
 *
 * Formality answers "how dressed up is this?"; style answers "what is the
 * aesthetic?". A leather jacket is casual and punk; a dinner jacket is formal
 * and black tie. Keeping them apart means neither filter has to lie.
 */

export const STYLE_GROUPS = [
  { id: 'core', label: 'Minimalist & classic', note: 'Clean lines, neutral colours, timeless silhouettes.' },
  { id: 'everyday', label: 'Casual & dressy casual', note: 'Denim and tees, then the elevated version of the same idea.' },
  { id: 'work', label: 'Smart & business casual', note: 'Collared shirts, structured trousers, unstructured tailoring.' },
  { id: 'formal', label: 'Formal & event', note: 'From cocktail dress codes to white tie.' },
  { id: 'sport', label: 'Sporty & athleisure', note: 'Athletic pieces worn outside the gym.' },
  { id: 'street', label: 'Streetwear', note: 'Skate and hip-hop roots, graphic tees, cargoes, limited sneakers.' },
  { id: 'subculture', label: 'Subculture & retro', note: 'Punk, grunge, preppy, bohemian, goth and mod.' },
  { id: 'expressive', label: 'Artsy & androgynous', note: 'Mixed prints, unconventional cuts and unisex silhouettes.' },
] as const;

export type StyleGroupId = (typeof STYLE_GROUPS)[number]['id'];

export const STYLE_IDS = [
  'minimalist-classic',
  'casual',
  'dressy-casual',
  'smart-casual',
  'business-casual',
  'semi-formal',
  'business-formal',
  'black-tie',
  'white-tie',
  'sporty-athleisure',
  'streetwear',
  'japanese-streetwear',
  'punk',
  'grunge',
  'preppy',
  'bohemian',
  'goth',
  'mod',
  'artsy',
  'eclectic',
  'androgynous',
] as const;

export type StyleId = (typeof STYLE_IDS)[number];

export interface StyleGuide {
  id: StyleId;
  label: string;
  group: StyleGroupId;
  summary: string;
  /** The pieces that make the look recognisable, not a shopping list. */
  pieces: readonly string[];
}

export const STYLES: readonly StyleGuide[] = [
  {
    id: 'minimalist-classic',
    label: 'Minimalist & classic',
    group: 'core',
    summary: 'Clean lines, high function, neutrals and timeless shapes without flash or hardware.',
    pieces: ['white tee', 'merino crew', 'straight trousers', 'trench', 'leather loafers'],
  },
  {
    id: 'casual',
    label: 'Casual',
    group: 'everyday',
    summary: 'Everyday comfort: denim, tees, sneakers and easy silhouettes.',
    pieces: ['straight jeans', 'white tee', 'canvas trainers', 'field jacket'],
  },
  {
    id: 'dressy-casual',
    label: 'Dressy casual',
    group: 'everyday',
    summary: 'Casual garments paired with one elevated separate, such as a blazer over good denim.',
    pieces: ['blazer', 'dark jeans', 'silk camisole', 'loafers'],
  },
  {
    id: 'smart-casual',
    label: 'Smart casual',
    group: 'work',
    summary: 'Relaxed refinement: dark jeans or tapered trousers, polos, henleys, unstructured blazers.',
    pieces: ['unstructured blazer', 'dark jeans', 'polo', 'knit bomber', 'refined sneakers'],
  },
  {
    id: 'business-casual',
    label: 'Business casual',
    group: 'work',
    summary: 'Structured but not suited: chinos or wool trousers, collared shirts, cardigans, sleek shoes.',
    pieces: ['wool trousers', 'oxford shirt', 'cardigan', 'derbies', 'leather tote'],
  },
  {
    id: 'semi-formal',
    label: 'Semi-formal',
    group: 'formal',
    summary: 'Cocktail dresses or little black dresses; dark suits with a tie.',
    pieces: ['little black dress', 'dark suit', 'heels', 'clutch'],
  },
  {
    id: 'business-formal',
    label: 'Business formal',
    group: 'formal',
    summary: 'A dark matching jacket and trousers or skirt, with conservative accessories.',
    pieces: ['dark suit', 'dress shirt', 'derbies', 'leather belt'],
  },
  {
    id: 'black-tie',
    label: 'Black tie / creative black tie',
    group: 'formal',
    summary: 'Tuxedos and floor-length or cocktail gowns; creative black tie adds texture or colour.',
    pieces: ['dinner jacket', 'dress shirt', 'bow tie', 'evening gown', 'heels'],
  },
  {
    id: 'white-tie',
    label: 'White tie',
    group: 'formal',
    summary: 'The most formal evening dress: tailcoat, white piqué shirt, white waistcoat and bow tie.',
    pieces: ['tailcoat', 'white piqué shirt', 'white waistcoat', 'white bow tie', 'gown'],
  },
  {
    id: 'sporty-athleisure',
    label: 'Sporty & athleisure',
    group: 'sport',
    summary: 'Leggings, bike shorts, joggers and oversized sweatshirts taken out of the gym.',
    pieces: ['joggers', 'leggings', 'oversized sweatshirt', 'running shoes'],
  },
  {
    id: 'streetwear',
    label: 'Streetwear',
    group: 'street',
    summary: 'Graphic tees, hoodies, cargo pants, caps and limited-edition sneakers.',
    pieces: ['graphic tee', 'hoodie', 'cargo pants', 'cap', 'sneakers'],
  },
  {
    id: 'japanese-streetwear',
    label: 'Japanese streetwear',
    group: 'street',
    summary: 'Utilitarian layers, avant-garde silhouettes and traditional craft details.',
    pieces: ['utility jacket', 'wide trousers', 'work shirt', 'sneakers'],
  },
  {
    id: 'punk',
    label: 'Punk',
    group: 'subculture',
    summary: 'Studded leather, tartan, distressed denim, safety pins and combat boots.',
    pieces: ['leather jacket', 'tartan', 'distressed denim', 'combat boots'],
  },
  {
    id: 'grunge',
    label: 'Grunge',
    group: 'subculture',
    summary: 'Thrifted flannel, oversized knits, ripped jeans and black boots.',
    pieces: ['flannel shirt', 'oversized knit', 'ripped jeans', 'black boots'],
  },
  {
    id: 'preppy',
    label: 'Preppy',
    group: 'subculture',
    summary: 'East Coast prep and Ivy sport: polos, oxfords, argyle, blazers and boat shoes.',
    pieces: ['polo', 'oxford shirt', 'argyle knit', 'blazer', 'loafers'],
  },
  {
    id: 'bohemian',
    label: 'Bohemian',
    group: 'subculture',
    summary: 'A free-spirited 1960s and 70s look: flowing maxi dresses, natural dyes, suede and fringe.',
    pieces: ['maxi dress', 'suede jacket', 'fringe bag', 'printed scarf'],
  },
  {
    id: 'goth',
    label: 'Goth',
    group: 'subculture',
    summary: 'Victorian romanticism with dark palettes and dramatic silhouettes.',
    pieces: ['black lace dress', 'long coat', 'platform boots', 'silver jewellery'],
  },
  {
    id: 'mod',
    label: 'Mod',
    group: 'subculture',
    summary: 'Sharp 1960s tailoring: mini skirts, slim suits and Chelsea boots.',
    pieces: ['slim suit', 'mini skirt', 'Chelsea boots', 'polo'],
  },
  {
    id: 'artsy',
    label: 'Artsy',
    group: 'expressive',
    summary: 'Abstract prints, varied textures and unconventional cuts.',
    pieces: ['printed shirt', 'textured knit', 'sculptural skirt', 'statement accessory'],
  },
  {
    id: 'eclectic',
    label: 'Eclectic',
    group: 'expressive',
    summary: 'Deliberate mixing of eras, patterns and textures rather than one register.',
    pieces: ['mixed prints', 'vintage jacket', 'contrasting trousers', 'collected jewellery'],
  },
  {
    id: 'androgynous',
    label: 'Androgynous',
    group: 'expressive',
    summary: 'Menswear and womenswear blended through oversized, straight-line, unisex shapes.',
    pieces: ['oversized blazer', 'straight trousers', 'button-up shirt', 'derbies'],
  },
];

export const STYLE_LABELS: Record<StyleId, string> = Object.fromEntries(
  STYLES.map((style) => [style.id, style.label]),
) as Record<StyleId, string>;

export const STYLE_BY_ID: Record<StyleId, StyleGuide> = Object.fromEntries(
  STYLES.map((style) => [style.id, style]),
) as Record<StyleId, StyleGuide>;

export const isStyle = (value: unknown): value is StyleId =>
  typeof value === 'string' && (STYLE_IDS as readonly string[]).includes(value);

export const stylesInGroup = (group: StyleGroupId): StyleGuide[] =>
  STYLES.filter((style) => style.group === group);
