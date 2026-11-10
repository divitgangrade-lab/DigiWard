import type { WardrobeQuery } from '../domain/filter';
import { coverageSummary, type CollectionGap } from '../domain/gaps';
import type { WardrobeItem } from '../domain/schema';

interface GapsPanelProps {
  variant: 'rail' | 'section';
  gaps: readonly CollectionGap[];
  onApply: (filter: WardrobeQuery) => void;
  limit?: number;
}

const severityLabel = (severity: CollectionGap['severity']): string =>
  severity === 'critical' ? 'Needs attention' : 'Worth checking';

export function GapsPanel({ variant, gaps, onApply, limit }: GapsPanelProps) {
  const critical = gaps.filter((gap) => gap.severity === 'critical').length;

  if (variant === 'rail') {
    const shown = limit === undefined ? gaps.slice(0, 4) : gaps.slice(0, limit);
    return (
      <div className="rail-card">
        <h3 className="rail-card__title">Gaps in the collection</h3>
        {gaps.length === 0 ? (
          <p className="muted">
            Every category, occasion and formality has at least one piece. Gaps only flag structure, so this
            is not a verdict on the clothes themselves.
          </p>
        ) : (
          <>
            <p className="rail-card__note">
              {critical === 0
                ? `${gaps.length} open ${gaps.length === 1 ? 'note' : 'notes'}, none critical.`
                : `${critical} ${critical === 1 ? 'gap needs' : 'gaps need'} attention.`}
            </p>
            <ul className="gap-list gap-list--rail">
              {shown.map((gap) => (
                <li className="gap" key={gap.id}>
                  <p className="gap__meta">
                    <span className={`gap__badge gap__badge--${gap.severity}`}>{severityLabel(gap.severity)}</span>
                  </p>
                  <p className="gap__detail">{gap.detail}</p>
                  <button type="button" className="link-button" onClick={() => onApply(gap.filter)}>
                    Filter the catalogue
                  </button>
                </li>
              ))}
            </ul>
            <a className="rail-card__link" href="#gaps">
              See all {gaps.length} findings
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <section className="section" id="gaps" aria-labelledby="gaps-title">
      <div className="section__head">
        <h2 id="gaps-title">Gaps in the collection</h2>
        <p>
          Structural checks only: empty categories, occasions with nothing tagged, weather and seasons with no
          options, and formalities with a single piece. Weather notes are prompts to check against your own
          climate, not shopping instructions.
        </p>
      </div>

      {gaps.length === 0 ? (
        <div className="empty-state">
          <h3>No structural gaps</h3>
          <p>
            Every category has at least two pieces, every occasion has three or more, and every formality has an
            option. Add a new item and this report updates itself.
          </p>
        </div>
      ) : (
        <ul className="gap-list">
          {gaps.map((gap) => (
            <li className="gap" key={gap.id}>
              <div className="gap__head">
                <h3 className="gap__title">{gap.label}</h3>
                <span className={`gap__badge gap__badge--${gap.severity}`}>{severityLabel(gap.severity)}</span>
              </div>
              <p className="gap__detail">{gap.detail}</p>
              <div className="gap__foot">
                <span className="gap__kind">{gap.kind}</span>
                <button type="button" className="button button--small" onClick={() => onApply(gap.filter)}>
                  Filter the catalogue
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CoveragePanel({ items }: { items: readonly WardrobeItem[] }) {
  const coverage = coverageSummary(items);
  const max = Math.max(1, ...coverage.byCategory.map((row) => row.count));

  return (
    <div className="rail-card">
      <h3 className="rail-card__title">Coverage by category</h3>
      <ul className="coverage">
        {coverage.byCategory.map((row) => (
          <li className="coverage__row" key={row.label}>
            <span className="coverage__label">{row.label}</span>
            <span className="coverage__bar" aria-hidden="true">
              <span className="coverage__fill" style={{ width: `${(row.count / max) * 100}%` }} />
            </span>
            <span className="coverage__count">{row.count}</span>
          </li>
        ))}
      </ul>
      <p className="rail-card__note">Counts include sample entries until you replace them.</p>
    </div>
  );
}
