import { useState } from 'react';
import {
  AUDIT_LABELS,
  CATEGORY_LABELS,
  FORMALITY_LABELS,
  MOOD_LABELS,
  OCCASION_LABELS,
  SEASON_LABELS,
  WEATHER_LABELS,
  type WardrobeItem,
} from '../domain/schema';
import { STYLE_LABELS } from '../domain/styles';
import type { WearSummary } from '../domain/wear';
import { formatDisplayDate } from '../lib/date';
import { costPerWear, formatAmount, resolveImage, swatchFor, wearSentence } from '../lib/format';
import { CategoryGlyph } from './CategoryGlyph';

interface ItemDialogProps {
  item: WardrobeItem;
  summary: WearSummary;
  onClose: () => void;
  onEdit: () => void;
  onLogWear: () => void;
  onRemove: () => void;
}

const joinLabels = <T extends string>(values: readonly T[] | undefined, labels: Record<T, string>): string =>
  (values ?? []).map((value) => labels[value]).join(', ');

export function ItemDialog({ item, summary, onClose, onEdit, onLogWear, onRemove }: ItemDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const image = resolveImage(item.image, import.meta.env.BASE_URL);
  const cpw = costPerWear(item.price, summary.totalWears);

  const rows: { label: string; value: string | undefined }[] = [
    { label: 'Category', value: CATEGORY_LABELS[item.category] },
    { label: 'Formality', value: FORMALITY_LABELS[item.formality] },
    { label: 'Colour', value: item.color },
    { label: 'Material', value: item.material },
    { label: 'Seasons', value: joinLabels(item.seasons, SEASON_LABELS) || undefined },
    { label: 'Weather', value: joinLabels(item.weather, WEATHER_LABELS) || undefined },
    { label: 'Occasions', value: joinLabels(item.occasions, OCCASION_LABELS) || undefined },
    { label: 'Mood', value: joinLabels(item.moods, MOOD_LABELS) || undefined },
    { label: 'Style', value: joinLabels(item.styles, STYLE_LABELS) || undefined },
    { label: 'Core basic', value: item.core === true ? 'Yes, a carry-over piece' : undefined },
    { label: 'Audit', value: AUDIT_LABELS[item.audit ?? 'keep'] },
    { label: 'Paid', value: item.price === undefined ? undefined : formatAmount(item.price) },
    {
      label: 'Cost per wear',
      value: cpw === null ? (item.price === undefined ? undefined : 'Not worn yet') : formatAmount(cpw),
    },
    { label: 'Fit', value: item.fitNotes },
    { label: 'Care', value: item.care },
    { label: 'Notes', value: item.notes },
  ];

  return (
    <div className="dialog__panel">
      <div className="dialog__head">
        <div>
          <p className="dialog__kicker">
            {CATEGORY_LABELS[item.category]} · {FORMALITY_LABELS[item.formality]}
            {item.example === true ? ' · sample entry' : ''}
          </p>
          <h2 className="dialog__title" id="item-dialog-title">
            {item.name}
          </h2>
        </div>
        <button type="button" className="dialog__close" onClick={onClose} aria-label="Close item details">
          Close
        </button>
      </div>

      <div className="dialog__band" style={{ backgroundColor: swatchFor(item.colorHex) }}>
        {image !== null ? (
          <img className="dialog__image" src={image} alt="" decoding="async" />
        ) : (
          <span className="dialog__glyph">
            <CategoryGlyph category={item.category} size={36} />
          </span>
        )}
      </div>

      <dl className="detail-grid">
        {rows
          .filter((row) => row.value !== undefined && row.value.length > 0)
          .map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
      </dl>

      {(item.tags ?? []).length > 0 ? (
        <p className="dialog__tags">
          <span>Outfit tags:</span> {(item.tags ?? []).join(', ')}
        </p>
      ) : null}

      <section className="dialog__section" aria-labelledby="dialog-wear-title">
        <h3 className="dialog__subtitle" id="dialog-wear-title">
          Wear history
        </h3>
        <p className="dialog__wear-line">{wearSentence(summary)}</p>
        {summary.totalWears === 0 ? (
          <p className="muted">
            No dates logged yet. The rotation queue puts this piece near the front until you wear it.
          </p>
        ) : (
          <ul className="wear-dates">
            {summary.dates.slice(0, 10).map((date) => (
              <li key={date}>
                <time dateTime={date}>{formatDisplayDate(date)}</time>
              </li>
            ))}
          </ul>
        )}
        {summary.totalWears > 10 ? (
          <p className="muted">Showing the 10 most recent of {summary.totalWears} wears.</p>
        ) : null}
      </section>

      <div className="dialog__actions">
        <button type="button" className="button button--primary" onClick={onLogWear}>
          Wore it today
        </button>
        <button type="button" className="button" onClick={onEdit}>
          Edit item
        </button>
        {confirming ? (
          <>
            <button type="button" className="button button--danger" onClick={onRemove}>
              Remove permanently
            </button>
            <button type="button" className="button button--quiet" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className="button button--quiet" onClick={() => setConfirming(true)}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
