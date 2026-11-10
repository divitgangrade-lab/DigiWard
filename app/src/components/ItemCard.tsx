import type { WardrobeItem } from '../domain/schema';
import { CATEGORY_LABELS, FORMALITY_LABELS } from '../domain/schema';
import type { WearSummary } from '../domain/wear';
import { resolveImage, swatchFor, wearSentence } from '../lib/format';
import { CategoryGlyph } from './CategoryGlyph';

interface ItemCardProps {
  item: WardrobeItem;
  summary: WearSummary;
  onOpen: (id: string) => void;
  onLogWear: (id: string) => void;
}

export function ItemCard({ item, summary, onOpen, onLogWear }: ItemCardProps) {
  const image = resolveImage(item.image, import.meta.env.BASE_URL);
  const nameId = `item-name-${item.id}`;
  const tags = item.tags ?? [];

  return (
    <article className="item-card" aria-labelledby={nameId}>
      <div className="item-card__swatch" style={{ backgroundColor: swatchFor(item.colorHex) }}>
        {image !== null ? (
          <img className="item-card__image" src={image} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="item-card__glyph">
            <CategoryGlyph category={item.category} size={44} />
          </span>
        )}
        {item.example === true ? <span className="item-card__flag">Sample</span> : null}
      </div>

      <div className="item-card__body">
        <p className="item-card__kicker">
          {CATEGORY_LABELS[item.category]} · {FORMALITY_LABELS[item.formality]}
        </p>
        <h3 className="item-card__name" id={nameId}>
          {item.name}
        </h3>

        <dl className="item-card__facts">
          <div>
            <dt>Colour</dt>
            <dd>{item.color}</dd>
          </div>
          <div>
            <dt>Material</dt>
            <dd>{item.material}</dd>
          </div>
          {item.fitNotes ? (
            <div>
              <dt>Fit</dt>
              <dd className="item-card__clamp">{item.fitNotes}</dd>
            </div>
          ) : null}
        </dl>

        {tags.length > 0 ? (
          <p className="item-card__tags">
            <span>Outfits:</span> {tags.join(', ')}
          </p>
        ) : null}

        <p className="item-card__wear">{wearSentence(summary)}</p>

        <div className="item-card__actions">
          <button type="button" className="button button--primary button--small" onClick={() => onLogWear(item.id)}>
            Wore it today
          </button>
          <button
            type="button"
            className="button button--quiet button--small"
            onClick={() => onOpen(item.id)}
            aria-label={`Open details for ${item.name}`}
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
}
