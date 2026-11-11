import {
  activeFilterCount,
  toggleValue,
  type TagUse,
  type WardrobeQuery,
} from '../domain/filter';
import {
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
  type AuditPile,
  type Category,
  type Formality,
  type Mood,
  type Occasion,
  type Season,
  type Weather,
} from '../domain/schema';
import type { StyleId } from '../domain/styles';
import { AUDIT_OPTIONS, STYLE_OPTIONS } from '../domain/options';
import { SORT_MODES, type SortMode } from '../lib/sort';
import { SelectField } from './fields';

interface FilterBarProps {
  query: WardrobeQuery;
  onChange: (patch: Partial<WardrobeQuery>) => void;
  onClear: () => void;
  sort: SortMode;
  onSortChange: (mode: SortMode) => void;
  shown: number;
  total: number;
  tags: readonly TagUse[];
}

const labelOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

export function FilterBar({
  query,
  onChange,
  onClear,
  sort,
  onSortChange,
  shown,
  total,
  tags,
}: FilterBarProps) {
  const activeCount = activeFilterCount(query);
  const categories = query.categories ?? [];

  return (
    <div className="toolbar">
      <div className="segmented" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={categories.length === 0 ? 'segmented__button is-active' : 'segmented__button'}
          aria-pressed={categories.length === 0}
          onClick={() => onChange({ categories: [] })}
        >
          All pieces
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={categories.includes(category) ? 'segmented__button is-active' : 'segmented__button'}
            aria-pressed={categories.includes(category)}
            onClick={() => onChange({ categories: toggleValue<Category>(categories, category) })}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <div className="filters">
        <SelectField<Occasion>
          id="filter-occasion"
          label="Occasion"
          includeEmpty
          emptyLabel="Any occasion"
          value={query.occasions?.[0] ?? ''}
          onChange={(value) => onChange({ occasions: value === '' ? [] : [value as Occasion] })}
          options={labelOptions(OCCASIONS, OCCASION_LABELS)}
          className="field--filter"
        />
        <SelectField<Weather>
          id="filter-weather"
          label="Weather"
          includeEmpty
          emptyLabel="Any weather"
          value={query.weather?.[0] ?? ''}
          onChange={(value) => onChange({ weather: value === '' ? [] : [value as Weather] })}
          options={labelOptions(WEATHER, WEATHER_LABELS)}
          className="field--filter"
        />
        <SelectField<Mood>
          id="filter-mood"
          label="Mood"
          includeEmpty
          emptyLabel="Any mood"
          value={query.moods?.[0] ?? ''}
          onChange={(value) => onChange({ moods: value === '' ? [] : [value as Mood] })}
          options={labelOptions(MOODS, MOOD_LABELS)}
          className="field--filter"
        />
        <SelectField<Formality>
          id="filter-formality"
          label="Formality"
          includeEmpty
          emptyLabel="Any formality"
          value={query.formality?.[0] ?? ''}
          onChange={(value) => onChange({ formality: value === '' ? [] : [value as Formality] })}
          options={labelOptions(FORMALITY, FORMALITY_LABELS)}
          className="field--filter"
        />
        <SelectField<StyleId>
          id="filter-style"
          label="Style"
          includeEmpty
          emptyLabel="Any style"
          value={query.styles?.[0] ?? ''}
          onChange={(value) => onChange({ styles: value === '' ? [] : [value as StyleId] })}
          options={STYLE_OPTIONS}
          className="field--filter"
        />
        <SelectField<Season>
          id="filter-season"
          label="Season"
          includeEmpty
          emptyLabel="Any season"
          value={query.seasons?.[0] ?? ''}
          onChange={(value) => onChange({ seasons: value === '' ? [] : [value as Season] })}
          options={labelOptions(SEASONS, SEASON_LABELS)}
          className="field--filter"
        />
        <SelectField<string>
          id="filter-tag"
          label="Outfit tag"
          includeEmpty
          emptyLabel="Any tag"
          value={query.tags?.[0] ?? ''}
          onChange={(value) => onChange({ tags: value === '' ? [] : [value] })}
          options={tags.map((tag) => ({ value: tag.tag, label: `${tag.tag} (${tag.count})` }))}
          className="field--filter"
        />
        <SelectField<AuditPile>
          id="filter-audit"
          label="Audit"
          includeEmpty
          emptyLabel="Any pile"
          value={query.audit?.[0] ?? ''}
          onChange={(value) => onChange({ audit: value === '' ? [] : [value as AuditPile] })}
          options={AUDIT_OPTIONS}
          className="field--filter"
        />
        <SelectField<SortMode>
          id="sort-mode"
          label="Sort"
          value={sort}
          onChange={onSortChange}
          options={SORT_MODES.map((mode) => ({ value: mode.value, label: mode.label }))}
          className="field--filter"
        />
      </div>

      <div className="results-bar">
        <p className="results-bar__count" aria-live="polite">
          Showing <strong>{shown}</strong> of {total} {total === 1 ? 'piece' : 'pieces'}
          {activeCount > 0 ? (
            <span className="results-bar__active">
              {" "}
              · {activeCount} {activeCount === 1 ? 'filter' : 'filters'} on
            </span>
          ) : null}
        </p>
        <div className="results-bar__controls">
          <label className="check check--inline">
            <input
              type="checkbox"
              checked={query.unwornOnly === true}
              onChange={(event) => onChange({ unwornOnly: event.target.checked })}
            />
            <span>Only unlogged pieces</span>
          </label>
          {activeCount > 0 ? (
            <button type="button" className="button button--quiet button--small" onClick={onClear}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
