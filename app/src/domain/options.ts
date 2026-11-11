import {
  AUDIT_LABELS,
  AUDIT_PILES,
  CATEGORIES,
  CATEGORY_LABELS,
  FORMALITY,
  FORMALITY_LABELS,
  MOODS,
  MOOD_LABELS,
  OCCASIONS,
  OCCASION_LABELS,
  SEASONS,
  SEASON_LABELS,
  WEATHER,
  WEATHER_LABELS,
} from './schema';
import { STYLE_LABELS, STYLE_IDS } from './styles';

export const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }));
export const OCCASION_OPTIONS = OCCASIONS.map((value) => ({ value, label: OCCASION_LABELS[value] }));
export const WEATHER_OPTIONS = WEATHER.map((value) => ({ value, label: WEATHER_LABELS[value] }));
export const SEASON_OPTIONS = SEASONS.map((value) => ({ value, label: SEASON_LABELS[value] }));
export const MOOD_OPTIONS = MOODS.map((value) => ({ value, label: MOOD_LABELS[value] }));
export const FORMALITY_OPTIONS = FORMALITY.map((value) => ({ value, label: FORMALITY_LABELS[value] }));
export const STYLE_OPTIONS = STYLE_IDS.map((value) => ({ value, label: STYLE_LABELS[value] }));
export const AUDIT_OPTIONS = AUDIT_PILES.map((value) => ({ value, label: AUDIT_LABELS[value] }));
