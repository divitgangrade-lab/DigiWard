import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  CATEGORY_LABELS,
  type Category,
  type Formality,
  type Mood,
  type Occasion,
  type Season,
  type WardrobeItem,
  type Weather,
} from '../domain/schema';
import { toggleValue } from '../domain/filter';
import {
  CATEGORY_OPTIONS,
  FORMALITY_OPTIONS,
  MOOD_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  WEATHER_OPTIONS,
} from '../domain/options';
import { validateWardrobeItem, type ValidationIssue } from '../domain/validate';
import { swatchFor } from '../lib/format';
import { CheckboxGroup, SelectField, TextAreaField, TextField } from './fields';

interface ItemFormProps {
  item?: WardrobeItem | undefined;
  onSave: (item: WardrobeItem) => void;
  onCancel: () => void;
}

const splitTags = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

/** New items get a real unique id, so a repeated name can never overwrite one. */
const createItemId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export function ItemForm({ item, onSave, onCancel }: ItemFormProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? 'tops');
  const [color, setColor] = useState(item?.color ?? '');
  const [colorHex, setColorHex] = useState(item?.colorHex ?? '#8a8177');
  const [material, setMaterial] = useState(item?.material ?? '');
  const [formality, setFormality] = useState<Formality>(item?.formality ?? 'casual');
  const [fitNotes, setFitNotes] = useState(item?.fitNotes ?? '');
  const [care, setCare] = useState(item?.care ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [image, setImage] = useState(item?.image ?? '');
  const [seasons, setSeasons] = useState<Season[]>(item?.seasons ?? []);
  const [weather, setWeather] = useState<Weather[]>(item?.weather ?? []);
  const [occasions, setOccasions] = useState<Occasion[]>(item?.occasions ?? []);
  const [moods, setMoods] = useState<Mood[]>(item?.moods ?? []);
  const [tagText, setTagText] = useState((item?.tags ?? []).join(', '));
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);

  const errors = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of issues) {
      if (!map.has(issue.field)) map.set(issue.field, issue.message);
    }
    return map;
  }, [issues]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const raw: Record<string, unknown> = {
      name,
      category,
      color,
      colorHex,
      material,
      formality,
      ...(fitNotes.trim() ? { fitNotes } : {}),
      ...(care.trim() ? { care } : {}),
      ...(notes.trim() ? { notes } : {}),
      ...(image.trim() ? { image: image.trim() } : {}),
      ...(seasons.length > 0 ? { seasons } : {}),
      ...(weather.length > 0 ? { weather } : {}),
      ...(occasions.length > 0 ? { occasions } : {}),
      ...(moods.length > 0 ? { moods } : {}),
      ...(splitTags(tagText).length > 0 ? { tags: splitTags(tagText) } : {}),
      id: item ? item.id : createItemId(),
      ...(item?.wearLog ? { wearLog: item.wearLog } : {}),
      ...(item?.example ? { example: true } : {}),
    };

    const result = validateWardrobeItem(raw);
    if (!result.ok) {
      setIssues(result.issues);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setIssues([]);
    onSave(result.item);
  };

  return (
    <form className="item-form" onSubmit={handleSubmit} noValidate>
      <div className="dialog__head">
        <div>
          <p className="dialog__kicker">{item ? 'Editing a catalogued piece' : 'New piece'}</p>
          <h2 className="dialog__title" id="item-form-title">
            {item ? `Edit ${item.name}` : 'Add an item'}
          </h2>
        </div>
        <button type="button" className="dialog__close" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <p className="item-form__note">
        Five fields are required. Category, colour, formality, occasion, weather and mood are what outfit
        filtering actually reads, so they are worth getting right first.
      </p>

      {issues.length > 0 ? (
        <div className="form-errors" ref={summaryRef} tabIndex={-1} role="alert">
          <h3 className="form-errors__title">Check {issues.length === 1 ? 'one field' : `${issues.length} fields`}</h3>
          <ul>
            {issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>
                <strong>{issue.field}</strong>: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset className="item-form__group">
        <legend className="item-form__legend">Identity</legend>
        <div className="form-grid">
          <TextField
            id="item-form-name"
            label="Name"
            value={name}
            onChange={setName}
            required
            autoFocus
            maxLength={120}
            placeholder="Heavyweight oxford shirt"
            error={errors.get('name')}
          />
          <SelectField<Category>
            id="item-form-category"
            label="Category"
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
            error={errors.get('category')}
          />
          <SelectField<Formality>
            id="item-form-formality"
            label="Formality"
            value={formality}
            onChange={setFormality}
            options={FORMALITY_OPTIONS}
            error={errors.get('formality')}
          />
          <TextField
            id="item-form-color"
            label="Colour in words"
            value={color}
            onChange={setColor}
            required
            maxLength={60}
            placeholder="oxblood"
            hint="Use the word you would search for. Hex codes are not searchable."
            error={errors.get('color')}
          />
          <div className="field field--swatch">
            <label className="field__label" htmlFor="item-form-colorHex">
              Swatch
            </label>
            <p className="field__hint" id="item-form-colorHex-hint">
              Optional. Only affects how the card looks.
            </p>
            <div className="swatch-row">
              <input
                id="item-form-colorHex"
                className="field__color"
                type="color"
                value={swatchFor(colorHex)}
                onChange={(event) => setColorHex(event.target.value)}
                aria-describedby="item-form-colorHex-hint"
              />
              <input
                className="field__input"
                type="text"
                value={colorHex}
                onChange={(event) => setColorHex(event.target.value)}
                aria-label="Swatch hex value"
                aria-invalid={errors.get('colorHex') ? true : undefined}
                aria-describedby={
                  errors.get('colorHex')
                    ? 'item-form-colorHex-hint item-form-colorHex-error'
                    : 'item-form-colorHex-hint'
                }
                maxLength={7}
              />
            </div>
            {errors.get('colorHex') ? (
              <p className="field__error" id="item-form-colorHex-error">
                {errors.get('colorHex')}
              </p>
            ) : null}
          </div>
          <TextField
            id="item-form-material"
            label="Material"
            value={material}
            onChange={setMaterial}
            required
            maxLength={80}
            placeholder="cotton oxford"
            error={errors.get('material')}
          />
        </div>
      </fieldset>

      <fieldset className="item-form__group">
        <legend className="item-form__legend">When you reach for it</legend>
        <CheckboxGroup
          id="item-form-seasons"
          legend="Seasons"
          hint="Leave blank if it works all year."
          options={SEASON_OPTIONS}
          selected={seasons}
          onToggle={(value: Season) => setSeasons(toggleValue(seasons, value))}
        />
        <CheckboxGroup
          id="item-form-weather"
          legend="Weather"
          options={WEATHER_OPTIONS}
          selected={weather}
          onToggle={(value: Weather) => setWeather(toggleValue(weather, value))}
        />
        <CheckboxGroup
          id="item-form-occasions"
          legend="Occasions"
          options={OCCASION_OPTIONS}
          selected={occasions}
          onToggle={(value: Occasion) => setOccasions(toggleValue(occasions, value))}
        />
        <CheckboxGroup
          id="item-form-moods"
          legend="Mood"
          options={MOOD_OPTIONS}
          selected={moods}
          onToggle={(value: Mood) => setMoods(toggleValue(moods, value))}
        />
      </fieldset>

      <fieldset className="item-form__group">
        <legend className="item-form__legend">Fit and notes</legend>
        <TextAreaField
          id="item-form-fitNotes"
          label="Fit notes"
          value={fitNotes}
          onChange={setFitNotes}
          rows={3}
          maxLength={240}
          placeholder="Boxy through the body, sleeves run 2cm long."
          hint="What you would tell a friend trying it on."
          error={errors.get('fitNotes')}
        />
        <TextField
          id="item-form-tags"
          label="Outfit tags"
          value={tagText}
          onChange={setTagText}
          placeholder="desk-uniform, winter-evening"
          hint="Comma separated. Tags group pieces into combinations you already wear."
          error={errors.get('tags')}
        />
        <div className="form-grid">
          <TextField
            id="item-form-care"
            label="Care"
            value={care}
            onChange={setCare}
            placeholder="Cold wash, dry flat"
            error={errors.get('care')}
          />
          <TextField
            id="item-form-image"
            label="Image path"
            value={image}
            onChange={setImage}
            placeholder="media/shirt.jpg"
            hint="Optional. A local file path, or an https address."
            error={errors.get('image')}
          />
        </div>
        <TextAreaField
          id="item-form-notes"
          label="Notes"
          value={notes}
          onChange={setNotes}
          rows={3}
          maxLength={2000}
          placeholder="Where it came from, repairs owed, anything worth remembering."
          error={errors.get('notes')}
        />
      </fieldset>

      <div className="dialog__actions">
        <button type="submit" className="button button--primary">
          {item ? 'Save changes' : 'Add to wardrobe'}
        </button>
        <button type="button" className="button button--quiet" onClick={onCancel}>
          Cancel
        </button>
        {item ? <span className="dialog__meta">{CATEGORY_LABELS[item.category]} · wear log kept</span> : null}
      </div>
    </form>
  );
}
