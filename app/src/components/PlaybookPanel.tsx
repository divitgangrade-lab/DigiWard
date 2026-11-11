import { CAPSULE_PRESETS, type CapsulePreset } from '../data/presets';
import {
  AUDIT_LABELS,
  AUDIT_PILES,
  type AuditPile,
  type WardrobeItem,
} from '../domain/schema';
import { STYLES, STYLE_GROUPS, STYLE_LABELS, type StyleId } from '../domain/styles';
import {
  CORE_TARGET,
  auditCounts,
  capsuleCoverage,
  coreRatio,
  formulaCounts,
  styleCounts,
  valueSummary,
} from '../domain/playbook';
import type { WearSummary } from '../domain/wear';
import { formatAmount } from '../lib/format';

interface PlaybookPanelProps {
  items: readonly WardrobeItem[];
  summaries: ReadonlyMap<string, WearSummary>;
  onFilterStyle: (style: StyleId) => void;
  onFilterAudit: (pile: AuditPile) => void;
  onLoadPreset: (preset: CapsulePreset) => void;
}

const percent = (value: number): number => Math.round(value * 100);

export function PlaybookPanel({
  items,
  summaries,
  onFilterStyle,
  onFilterAudit,
  onLoadPreset,
}: PlaybookPanelProps) {
  const core = coreRatio(items);
  const value = valueSummary(items, summaries);
  const audit = auditCounts(items);
  const styles = new Map(styleCounts(items).map((entry) => [entry.style, entry.count]));
  const formulas = formulaCounts(items);
  const capsule = capsuleCoverage(items);
  const corePercent = percent(core.ratio);
  const targetPercent = percent(CORE_TARGET);

  return (
    <section className="section playbook" id="playbook" aria-labelledby="playbook-title">
      <div className="section__head">
        <h2 id="playbook-title">The style playbook</h2>
        <p>
          Rules for making the wardrobe work harder: a style library, capsule presets, outfit formulas
          and the numbers behind them. Everything here is derived from the pieces you own; nothing is
          assumed about your climate, budget or taste.
        </p>
      </div>

      <div className="playbook__metrics">
        <article className="metric-card">
          <p className="metric-card__kicker">70/30 rule</p>
          <p className="metric-card__value">
            {corePercent}% <span>timeless basics</span>
          </p>
          <div
            className="meter"
            role="progressbar"
            aria-label="Share of timeless basics"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={corePercent}
          >
            <span className="meter__fill" style={{ width: `${Math.min(100, corePercent)}%` }} />
            <span className="meter__target" style={{ left: `${targetPercent}%` }} aria-hidden="true" />
          </div>
          <p className="metric-card__note">
            {core.total === 0
              ? 'Add pieces and mark the carry-over basics.'
              : `${core.core} of ${core.total} pieces are marked core. The marker sits at ${targetPercent}%.`}
          </p>
        </article>

        <article className="metric-card">
          <p className="metric-card__kicker">Cost per wear</p>
          <p className="metric-card__value">
            {value.average === null ? '—' : formatAmount(value.average)}
            <span>per wear</span>
          </p>
          <p className="metric-card__note">
            {value.priced === 0
              ? 'Add a price to a piece and log a wear to see the number.'
              : `${value.priced} priced ${value.priced === 1 ? 'piece' : 'pieces'}, ${value.totalWears} wears and ${formatAmount(value.totalPrice)} recorded in total.`}
          </p>
          <p className="metric-card__note">Price is a plain number in your own currency.</p>
        </article>

        <article className="metric-card">
          <p className="metric-card__kicker">Closet audit</p>
          <p className="metric-card__value">
            {audit.counts.keep} <span>keep</span>
          </p>
          <div className="audit-buttons">
            {AUDIT_PILES.map((pile) => (
              <button
                key={pile}
                type="button"
                className="chip chip--button"
                onClick={() => onFilterAudit(pile)}
                aria-label={`Show the ${AUDIT_LABELS[pile]} pile (${audit.counts[pile]})`}
              >
                {AUDIT_LABELS[pile]} <strong>{audit.counts[pile]}</strong>
              </button>
            ))}
          </div>
          <p className="metric-card__note">
            Keep, alter, donate or sell. Use the audit field on an item; missing means keep.
          </p>
        </article>
      </div>

      <div className="playbook__rules">
        <h3 className="subhead">House rules</h3>
        <ul className="rule-list">
          <li>
            <strong>70/30.</strong> Roughly 70% timeless neutrals, 30% trend, print or seasonal
            statement. The meter above counts the pieces you mark as core.
          </li>
          <li>
            <strong>Three colours.</strong> Two core neutrals plus one accent hue is enough for a
            capsule; it is a mixing rule, not a law about your wardrobe.
          </li>
          <li>
            <strong>30 wears and the rule of three.</strong> Before a purchase, check that you will
            wear it at least 30 times and that it pairs with three existing pieces.
          </li>
          <li>
            <strong>Three-piece rule.</strong> A top and bottom becomes an outfit with a third piece:
            a blazer, overshirt, cardigan or knit over the shoulders.
          </li>
        </ul>
      </div>

      <div className="playbook__block">
        <div className="playbook__block-head">
          <h3 className="subhead">Style library</h3>
          <p className="muted">
            {STYLES.length} aesthetics and dress codes across {STYLE_GROUPS.length} families. A piece
            can carry more than one; filter the catalogue to see what you already own.
          </p>
        </div>

        <div className="style-groups">
          {STYLE_GROUPS.map((group) => (
            <section className="style-group" key={group.id} aria-labelledby={`style-group-${group.id}`}>
              <div className="style-group__head">
                <h4 id={`style-group-${group.id}`}>{group.label}</h4>
                <p>{group.note}</p>
              </div>
              <ul className="style-grid">
                {STYLES.filter((style) => style.group === group.id).map((style) => {
                  const count = styles.get(style.id) ?? 0;
                  return (
                    <li className="style-card" key={style.id}>
                      <div className="style-card__head">
                        <h5>{style.label}</h5>
                        <span className="style-card__count">{count}</span>
                      </div>
                      <p className="style-card__summary">{style.summary}</p>
                      <p className="style-card__pieces">Key pieces: {style.pieces.join(', ')}</p>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => onFilterStyle(style.id)}
                      >
                        {count === 0
                          ? 'No pieces tagged yet'
                          : `Show ${count} ${count === 1 ? 'piece' : 'pieces'}`}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="playbook__block">
        <div className="playbook__block-head">
          <h3 className="subhead">Capsule presets</h3>
          <p className="muted">
            Add a ready-made set to the wardrobe. Presets only add pieces that are not already
            there, so edits and existing wear logs are never overwritten.
          </p>
        </div>
        <ul className="preset-grid">
          {CAPSULE_PRESETS.map((preset) => {
            const present = preset.itemIds.filter((id) => items.some((item) => item.id === id)).length;
            return (
              <li className="preset-card" key={preset.id}>
                <p className="preset-card__meta">
                  {STYLE_LABELS[preset.style]} · {preset.itemIds.length} pieces
                </p>
                <h4>{preset.name}</h4>
                <p>{preset.summary}</p>
                <p className="preset-card__status">
                  {present} of {preset.itemIds.length} already in the wardrobe
                </p>
                <button type="button" className="button button--small" onClick={() => onLoadPreset(preset)}>
                  Add this capsule
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="playbook__block">
        <div className="playbook__block-head">
          <h3 className="subhead">Outfit formulas</h3>
          <p className="muted">
            Counts use the pieces currently catalogued, capped at each formula's quota. They count
            possibilities, not proof that every combination works together.
          </p>
        </div>
        <div className="formula-grid">
          <article className="formula-card">
            <p className="formula-card__number">{formulas.threeThreeThree}</p>
            <h4>3-3-3</h4>
            <p>Three tops, three bottoms and three pairs of shoes make 27 looks when all three are full.</p>
            <p className="formula-card__math">
              {Math.min(formulas.tops, 3)} tops × {Math.min(formulas.bottoms, 3)} bottoms ×{' '}
              {Math.min(formulas.shoes, 3)} shoes
            </p>
          </article>

          <article className="formula-card">
            <p className="formula-card__number">
              {capsule.filter((entry) => entry.met).length}/{capsule.length}
            </p>
            <h4>5-4-3-2-1 capsule</h4>
            <p>Five tops, four bottoms, three shoes, two layers and one dress per season.</p>
            <ul className="coverage-mini">
              {capsule.map((entry) => (
                <li key={entry.category} className={entry.met ? 'is-met' : ''}>
                  {entry.label} <span>{entry.have}/{entry.need}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="formula-card">
            <p className="formula-card__number">{formulas.moduleWithShoes}</p>
            <h4>Module method</h4>
            <p>Two bottoms, three tops, one layer and two shoe options create a small repeatable module.</p>
            <p className="formula-card__math">
              {formulas.moduleBase} base looks × {Math.min(formulas.shoes, 2)} shoe options
            </p>
          </article>

          <article className="formula-card">
            <p className="formula-card__number">{formulas.outerLayers}</p>
            <h4>Third piece</h4>
            <p>Outer layers are the easiest third piece: they change a plain top-and-bottom without new colours.</p>
            <p className="formula-card__math">Add a blazer, overshirt, cardigan or knit.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
