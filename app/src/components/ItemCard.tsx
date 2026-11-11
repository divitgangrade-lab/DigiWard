import type { WardrobeItem } from '../domain/schema';
import { CATEGORY_LABELS, FORMALITY_LABELS } from '../domain/schema';
import { STYLE_LABELS } from '../domain/styles';
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

        {item.core === true || (item.styles ?? []).length > 0 ? (
          <p className="item-card__styles">
            {item.core === true ? <span className="chip chip--core">Core basic</span> : null}
            {(item.styles ?? []).slice(0, 2).map((style) => (
              <span className="chip" key={style}>
                {STYLE_LABELS[style]}
              </span>
            ))}
            {(item.styles ?? []).length > 2 ? (
              <span className="chip chip--quiet">+{(item.styles ?? []).length - 2}</span>
            ) : null}
          </p>
        ) : null}

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
          <button
            type="button"
            className="button button--primary button--small"
            onClick={() => onLogWear(item.id)}
            aria-label={`Log ${item.name} as worn today`}
          >
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
