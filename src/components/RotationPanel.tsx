import { CATEGORY_LABELS } from '../domain/schema';
import type {
  CollectionWearStats,
  WearEntry,
  WearSummary,
} from '../domain/wear';
import { formatDisplayDate } from '../lib/date';
import { shortWearLine, wearSentence } from '../lib/format';

interface RotationPanelProps {
  variant: 'rail' | 'section';
  queue: readonly WearSummary[];
  recent?: readonly WearEntry[];
  stats?: CollectionWearStats;
  onLogWear: (id: string) => void;
  onOpen: (id: string) => void;
  onRemoveWear?: (id: string, date: string) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

export function RotationPanel({
  variant,
  queue,
  recent = [],
  stats,
  onLogWear,
  onOpen,
  onRemoveWear,
  expanded = false,
  onToggleExpanded,
}: RotationPanelProps) {
  if (variant === 'rail') {
    return (
      <div className="rail-card">
        <h3 className="rail-card__title">Due for rotation</h3>
        <p className="rail-card__note">
          Least worn in the last 30 days first, then the longest gap, then the name.
        </p>
        {queue.length === 0 ? (
          <p className="muted">Add a piece and the queue starts here.</p>
        ) : (
          <ol className="queue queue--rail">
            {queue.map((entry) => (
              <li className="queue__item" key={entry.item.id}>
                <div className="queue__body">
                  <button type="button" className="link-button" onClick={() => onOpen(entry.item.id)}>
                    {entry.item.name}
                  </button>
                  <span className="queue__meta">
                    {CATEGORY_LABELS[entry.item.category]} · {shortWearLine(entry)}
                  </span>
                </div>
                <button
                  type="button"
                  className="button button--tiny"
                  onClick={() => onLogWear(entry.item.id)}
                  aria-label={`Log a wear today for ${entry.item.name}`}
                >
                  Wore
                </button>
              </li>
            ))}
          </ol>
        )}
        <a className="rail-card__link" href="#rotation">
          Open the wear log
        </a>
      </div>
    );
  }

  return (
    <section className="section" id="rotation" aria-labelledby="rotation-title">
      <div className="section__head">
        <h2 id="rotation-title">Rotation and wear log</h2>
        <p>
          The queue takes the least worn piece in the last 30 days first. Equal counts go to whichever has
          waited longest, and exact ties go alphabetically, so the order does not shuffle between visits.
        </p>
      </div>

      {stats !== undefined ? (
        <dl className="stats stats--inline">
          <div>
            <dt>Pieces</dt>
            <dd>{stats.itemCount}</dd>
          </div>
          <div>
            <dt>Wears logged</dt>
            <dd>{stats.totalWears}</dd>
          </div>
          <div>
            <dt>Worn in 30 days</dt>
            <dd>{stats.wornInWindow}</dd>
          </div>
          <div>
            <dt>Never worn</dt>
            <dd>{stats.neverWorn}</dd>
          </div>
        </dl>
      ) : null}

      <div className="rotation-layout">
        <div className="rotation-queue">
          <h3 className="subhead">Next up</h3>
          {queue.length === 0 ? (
            <p className="muted">The wardrobe is empty, so there is nothing to rotate yet.</p>
          ) : (
            <ol className="queue">
              {queue.map((entry, index) => (
                <li className="queue__item" key={entry.item.id}>
                  <span className="queue__index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="queue__body">
                    <button type="button" className="link-button" onClick={() => onOpen(entry.item.id)}>
                      {entry.item.name}
                    </button>
                    <span className="queue__meta">{wearSentence(entry)}</span>
                  </div>
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() => onLogWear(entry.item.id)}
                    aria-label={`Log a wear today for ${entry.item.name}`}
                  >
                    Wore it today
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rotation-log">
          <div className="rotation-log__head">
            <h3 className="subhead">Recent wears</h3>
            {onToggleExpanded ? (
              <button type="button" className="button button--quiet button--tiny" onClick={onToggleExpanded}>
                {expanded ? 'Show fewer' : 'Show all'}
              </button>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <p className="muted">
              Nothing logged yet. Use "Wore it today" on a card, or from the detail view, and the history
              appears here.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="wear-table">
                <caption className="visually-hidden">Recent wears, newest first</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Piece</th>
                    <th scope="col">Category</th>
                    {onRemoveWear ? <th scope="col">Undo</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((entry: WearEntry) => (
                    <tr key={`${entry.item.id}-${entry.date}`}>
                      <td>
                        <time dateTime={entry.date}>{formatDisplayDate(entry.date)}</time>
                      </td>
                      <td>
                        <button type="button" className="link-button" onClick={() => onOpen(entry.item.id)}>
                          {entry.item.name}
                        </button>
                      </td>
                      <td>{CATEGORY_LABELS[entry.item.category]}</td>
                      {onRemoveWear ? (
                        <td>
                          <button
                            type="button"
                            className="button button--quiet button--tiny"
                            onClick={() => onRemoveWear(entry.item.id, entry.date)}
                            aria-label={`Remove the wear on ${formatDisplayDate(entry.date)} for ${entry.item.name}`}
                          >
                            Undo
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

