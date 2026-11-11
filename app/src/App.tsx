import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from './components/Dialog';
import { FilterBar } from './components/FilterBar';
import { CoveragePanel, GapsPanel } from './components/GapsPanel';
import { GooeyNav } from './components/GooeyNav';
import HeroVeil from './components/HeroVeil';
import { ItemCard } from './components/ItemCard';
import { ItemDialog } from './components/ItemDialog';
import { ItemForm } from './components/ItemForm';
import { PlaybookPanel } from './components/PlaybookPanel';
import { RotationPanel } from './components/RotationPanel';
import { TargetCursor } from './components/TargetCursor';
import { TemplatePanel } from './components/TemplatePanel';
import { presetItem, type CapsulePreset } from './data/presets';
import { EXAMPLE_ITEMS } from './data/seed';
import {
  activeFilterCount,
  filterItems,
  tagIndex,
  toggleValue,
  type WardrobeQuery,
} from './domain/filter';
import { findGaps } from './domain/gaps';
import { AUDIT_LABELS, type AuditPile, type WardrobeItem } from './domain/schema';
import { STYLE_LABELS, type StyleId } from './domain/styles';
import { validateWardrobeFile } from './domain/validate';
import {
  collectionWearStats,
  recentWears,
  rotationQueue,
  summarizeWear,
  withWearLogged,
  withWearRemoved,
  type WearSummary,
} from './domain/wear';
import { useActiveSection } from './hooks/useActiveSection';
import { useReducedMotion } from './hooks/useReducedMotion';
import { todayKey } from './lib/date';
import {
  downloadText,
  exportWardrobeJson,
  fetchTemplate,
  loadWardrobe,
  saveWardrobe,
} from './lib/storage';
import { sortItems, type SortMode } from './lib/sort';

type DialogState =
  | { kind: 'view'; id: string }
  | { kind: 'edit'; id: string }
  | { kind: 'add' }
  | null;

const NAV_SECTIONS = [
  { id: 'catalogue', label: 'Wardrobe', href: '#catalogue' },
  { id: 'rotation', label: 'Rotation', href: '#rotation' },
  { id: 'gaps', label: 'Gaps', href: '#gaps' },
  { id: 'playbook', label: 'Playbook', href: '#playbook' },
  { id: 'template', label: 'Template', href: '#template' },
] as const;

const SECTION_IDS = NAV_SECTIONS.map((section) => section.id);

export default function App() {
  const [initialLoad] = useState(loadWardrobe);
  const [items, setItems] = useState<WardrobeItem[]>(initialLoad.items);
  const [storageNotice, setStorageNotice] = useState<string | null>(initialLoad.notice ?? null);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState<WardrobeQuery>({});
  const [sort, setSort] = useState<SortMode>('recent');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [expandedWears, setExpandedWears] = useState(false);
  const [navOverride, setNavOverride] = useState<number | null>(null);
  const [today] = useState(() => new Date());
  const searchRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const activeSection = useActiveSection(SECTION_IDS);
  const activeNavIndex =
    navOverride ??
    Math.max(
      0,
      NAV_SECTIONS.findIndex((section) => section.id === activeSection),
    );

  useEffect(() => {
    setNavOverride(null);
  }, [activeSection]);

  useEffect(() => {
    if (status.length === 0) return;
    const timer = window.setTimeout(() => setStatus(''), 7000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const summaries = useMemo(
    () => new Map<string, WearSummary>(items.map((item) => [item.id, summarizeWear(item, { today })])),
    [items, today],
  );

  const visible = useMemo(() => {
    const filtered = filterItems(items, query);
    return sortItems(filtered, sort, summaries, today);
  }, [items, query, sort, summaries, today]);

  const gaps = useMemo(() => findGaps(items), [items]);
  const tags = useMemo(() => tagIndex(items), [items]);
  const stats = useMemo(() => collectionWearStats(items, { today }), [items, today]);
  const rotationRail = useMemo(() => rotationQueue(items, { today, limit: 4 }), [items, today]);
  const rotationSection = useMemo(() => rotationQueue(items, { today, limit: 8 }), [items, today]);
  const recent = useMemo(
    () => recentWears(items, { today, limit: expandedWears ? 200 : 12 }),
    [items, today, expandedWears],
  );

  const criticalGaps = gaps.filter((gap) => gap.severity === 'critical').length;
  const sampleCount = items.filter((item) => item.example === true).length;
  const activeItem = dialog?.kind === 'view' ? items.find((item) => item.id === dialog.id) ?? null : null;
  const editingItem = dialog?.kind === 'edit' ? items.find((item) => item.id === dialog.id) ?? undefined : undefined;
  const activeSummary = activeItem ? summaries.get(activeItem.id) ?? summarizeWear(activeItem, { today }) : null;

  const closeDialog = useCallback(() => setDialog(null), []);

  const commit = useCallback((next: WardrobeItem[], message: string) => {
    setItems(next);
    const outcome = saveWardrobe(next);
    setStorageNotice(outcome.ok ? null : outcome.message ?? 'This change could not be saved.');
    setStatus(message);
  }, []);

  const updateQuery = useCallback((patch: Partial<WardrobeQuery>) => {
    setQuery((current) => ({ ...current, ...patch }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery({});
    setStatus('Filters cleared.');
  }, []);

  const logWear = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    const date = todayKey(today);
    commit(
      items.map((entry) => (entry.id === id ? withWearLogged(entry, date) : entry)),
      `Logged ${item.name} for today.`,
    );
  };

  const removeWear = (id: string, date: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    commit(
      items.map((entry) => (entry.id === id ? withWearRemoved(entry, date) : entry)),
      `Removed the ${date} wear from ${item.name}.`,
    );
  };

  const saveItem = (item: WardrobeItem) => {
    const exists = items.some((entry) => entry.id === item.id);
    commit(
      exists ? items.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...items],
      exists ? `Saved changes to ${item.name}.` : `${item.name} added to the wardrobe.`,
    );
    setDialog(null);
  };

  const removeItem = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    commit(
      items.filter((entry) => entry.id !== id),
      `${item.name} removed from the wardrobe.`,
    );
    setDialog(null);
  };

  const applyGap = (filter: WardrobeQuery) => {
    setQuery((current) => ({ ...current, ...filter }));
    setStatus('Filtered the catalogue to that gap.');
    document.getElementById('catalogue')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const toggleTag = (tag: string) => {
    updateQuery({ tags: toggleValue(query.tags, tag) });
  };

  const importText = (text: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setStatus('Import failed: the file is not valid JSON.');
      return;
    }
    const file = validateWardrobeFile(parsed);
    if (file.items.length === 0) {
      setStatus(`Import failed: ${file.issues[0]?.message ?? 'no usable items were found.'}`);
      return;
    }
    const existingIds = new Set(items.map((item) => item.id));
    const additions = file.items.filter((item) => !existingIds.has(item.id));
    if (additions.length === 0) {
      setStatus('Nothing imported: every item in that file is already in the wardrobe.');
      return;
    }
    const skippedNote = file.skipped > 0 ? ` Skipped ${file.skipped} broken ${file.skipped === 1 ? 'record' : 'records'}.` : '';
    commit([...items, ...additions], `Imported ${additions.length} ${additions.length === 1 ? 'item' : 'items'}.${skippedNote}`);
  };

  const exportWardrobe = () => {
    downloadText('digiward-wardrobe.json', exportWardrobeJson(items));
    setStatus(`Exported ${items.length} ${items.length === 1 ? 'item' : 'items'}.`);
  };

  const downloadTemplate = async () => {
    try {
      const text = await fetchTemplate();
      downloadText('wardrobe-template.json', text);
      setStatus('Template downloaded.');
    } catch {
      setStatus('The template could not be downloaded. Check the connection and try again.');
    }
  };

  const copyTemplate = async () => {
    try {
      const text = await fetchTemplate();
      if (navigator.clipboard === undefined) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setStatus('Template JSON copied to the clipboard.');
    } catch {
      setStatus('Copying failed. Use the download button instead.');
    }
  };

  const restoreSamples = () => {
    commit(EXAMPLE_ITEMS.map((item) => ({ ...item })), 'Sample catalogue restored.');
  };

  const loadPreset = (preset: CapsulePreset) => {
    const existingIds = new Set(items.map((item) => item.id));
    const additions: WardrobeItem[] = [];
    for (const id of preset.itemIds) {
      if (existingIds.has(id)) continue;
      const source = presetItem(id);
      if (!source) continue;
      additions.push({
        ...source,
        wearLog: [...(source.wearLog ?? [])],
        tags: [...(source.tags ?? [])],
        styles: [...(source.styles ?? [])],
      });
      existingIds.add(id);
    }
    if (additions.length === 0) {
      setStatus(`Every piece in ${preset.name} is already in the wardrobe.`);
      return;
    }
    const already = preset.itemIds.length - additions.length;
    commit(
      [...items, ...additions],
      `Added ${additions.length} ${additions.length === 1 ? 'piece' : 'pieces'} from ${preset.name}.${already > 0 ? ` ${already} ${already === 1 ? 'was' : 'were'} already here.` : ''}`,
    );
  };

  const filterStyle = (style: StyleId) => {
    setQuery({ styles: [style] });
    setStatus(`Filtered the catalogue to ${STYLE_LABELS[style]}.`);
    document.getElementById('catalogue')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const filterAudit = (pile: AuditPile) => {
    setQuery({ audit: [pile] });
    setStatus(`Showing the ${AUDIT_LABELS[pile]} pile.`);
    document.getElementById('catalogue')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const startEmpty = () => {
    commit([], 'Wardrobe cleared. Add your first piece when you are ready.');
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#catalogue">
        Skip to the catalogue
      </a>

      <header className="masthead">
        <div className="masthead__inner">
          <a className="wordmark" href="#top">
            <span className="wordmark__mark" aria-hidden="true">
              D
            </span>
            <span className="wordmark__name">DigiWard</span>
            <span className="wordmark__tag">wardrobe index</span>
          </a>

          <div className="masthead__nav">
            <GooeyNav
              items={NAV_SECTIONS}
              activeIndex={activeNavIndex}
              onChange={(index) => setNavOverride(index)}
              ariaLabel="Sections"
            />
          </div>

          <div className="masthead__tools">
            <div className="search">
              <label className="search__label" htmlFor="catalogue-search">
                Search the wardrobe
              </label>
              <input
                id="catalogue-search"
                ref={searchRef}
                className="search__input"
                type="search"
                value={query.query ?? ''}
                placeholder="Colour, fabric, fit, tag"
                onChange={(event) => updateQuery({ query: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    document.getElementById('catalogue')?.scrollIntoView({
                      behavior: reduceMotion ? 'auto' : 'smooth',
                      block: 'start',
                    });
                  }
                }}
                aria-describedby="search-hint"
              />
              <kbd className="search__key" aria-hidden="true">
                /
              </kbd>
              <p className="visually-hidden" id="search-hint">
                Press slash from anywhere on the page to focus this field.
              </p>
            </div>
            <button
              type="button"
              className="button button--primary button--small"
              onClick={() => setDialog({ kind: 'add' })}
            >
              Add item
            </button>
          </div>
        </div>
      </header>

      <p className="status" role="status" aria-live="polite" aria-atomic="true">
        {status}
      </p>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="hero__context">A wardrobe you can search</p>
            <h1 className="hero__title" id="hero-title">
              Know what you own before you buy another thing.
            </h1>
            <p className="hero__lede">
              Catalogue each piece by fabric, colour, fit, season, formality and mood, then filter for the day
              in front of you. The same list shows what you actually wear, what sits untouched, and which
              occasions you have nothing for.
            </p>
            <div className="hero__actions">
              <button
                type="button"
                className="button button--primary"
                onClick={() =>
                  document.getElementById('catalogue')?.scrollIntoView({
                    behavior: reduceMotion ? 'auto' : 'smooth',
                    block: 'start',
                  })
                }
              >
                Browse the catalogue
              </button>
              <button type="button" className="button" onClick={() => setDialog({ kind: 'add' })}>
                Add a piece
              </button>
              <a className="link-arrow" href="#template">
                See the item template
              </a>
            </div>

            <dl className="stats">
              <div>
                <dt>Pieces</dt>
                <dd>{items.length}</dd>
              </div>
              <div>
                <dt>Wears logged</dt>
                <dd>{stats.totalWears}</dd>
              </div>
              <div>
                <dt>Never worn</dt>
                <dd>{stats.neverWorn}</dd>
              </div>
              <div>
                <dt>Gaps needing attention</dt>
                <dd>{criticalGaps}</dd>
              </div>
            </dl>
          </div>

          <figure className="hero__media">
            <div className={`hero__fold${reduceMotion ? ' hero__fold--static' : ''}`}>
              <HeroVeil />
            </div>
            <figcaption className="hero__caption">
              Fold study, generated for this site.
              {reduceMotion
                ? ' The image is decorative.'
                : ' Move the pointer across it to reveal the cloth. Decorative, and not one of your garments.'}
            </figcaption>
          </figure>
        </section>

        {storageNotice !== null ? (
          <div className="banner" role="status">
            <p>{storageNotice}</p>
            <button type="button" className="button button--quiet button--small" onClick={() => setStorageNotice(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        <section className="catalogue" id="catalogue" aria-labelledby="catalogue-title">
          <div className="section__head">
            <h2 id="catalogue-title">The catalogue</h2>
            <p>
              Search by colour, fibre or fit, then narrow with occasion, weather and mood. Category buttons and
              dropdowns stack, and the count updates as you go.
            </p>
          </div>

          {sampleCount > 0 ? (
            <div className="banner banner--soft">
              <p>
                <strong>
                  {sampleCount} {sampleCount === 1 ? 'piece is a sample' : 'pieces are samples'}.
                </strong>{' '}
                They show the structure, not your clothes. Replace or clear them before judging the gap report.
              </p>
              <div className="banner__actions">
                <button type="button" className="button button--quiet button--small" onClick={() => setDialog({ kind: 'add' })}>
                  Add your own
                </button>
                <button type="button" className="button button--quiet button--small" onClick={startEmpty}>
                  Start empty
                </button>
              </div>
            </div>
          ) : null}

          <div className="catalogue__layout">
            <div className="catalogue__main">
              <FilterBar
                query={query}
                onChange={updateQuery}
                onClear={clearFilters}
                sort={sort}
                onSortChange={setSort}
                shown={visible.length}
                total={items.length}
                tags={tags}
              />

              {visible.length === 0 ? (
                <div className="empty-state">
                  {items.length === 0 ? (
                    <>
                      <h3>Nothing catalogued yet</h3>
                      <p>
                        Add one piece to begin. Only five fields are required, and the template lists every
                        option.
                      </p>
                      <div className="empty-state__actions">
                        <button type="button" className="button button--primary" onClick={() => setDialog({ kind: 'add' })}>
                          Add your first item
                        </button>
                        <button type="button" className="button" onClick={restoreSamples}>
                          Load the samples
                        </button>
                        <a className="link-arrow" href="#template">
                          Open the template
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>No pieces match</h3>
                      <p>
                        {activeFilterCount(query)} {activeFilterCount(query) === 1 ? 'filter is' : 'filters are'}{' '}
                        narrowing the list. Clear them to see all {items.length} pieces.
                      </p>
                      <div className="empty-state__actions">
                        <button type="button" className="button button--primary" onClick={clearFilters}>
                          Clear filters
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <ul className="item-grid">
                  {visible.map((item) => {
                    const summary = summaries.get(item.id) ?? summarizeWear(item, { today });
                    return (
                      <li key={item.id}>
                        <ItemCard
                          item={item}
                          summary={summary}
                          onOpen={(id) => setDialog({ kind: 'view', id })}
                          onLogWear={logWear}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <aside className="rail" aria-label="Wardrobe summary">
              <CoveragePanel items={items} />
              <GapsPanel variant="rail" gaps={gaps} onApply={applyGap} limit={3} />
              <RotationPanel
                variant="rail"
                queue={rotationRail}
                onLogWear={logWear}
                onOpen={(id) => setDialog({ kind: 'view', id })}
              />
              {tags.length > 0 ? (
                <div className="rail-card">
                  <h3 className="rail-card__title">Outfit tags</h3>
                  <p className="rail-card__note">Tags group pieces into combinations you already wear.</p>
                  <div className="tag-list">
                    {tags.map((tag) => {
                      const active = query.tags?.includes(tag.tag) ?? false;
                      return (
                        <button
                          key={tag.tag}
                          type="button"
                          className={active ? 'tag is-active' : 'tag'}
                          aria-pressed={active}
                          onClick={() => toggleTag(tag.tag)}
                        >
                          {tag.tag}
                          <span className="tag__count">{tag.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <RotationPanel
          variant="section"
          queue={rotationSection}
          recent={recent}
          stats={stats}
          onLogWear={logWear}
          onOpen={(id) => setDialog({ kind: 'view', id })}
          onRemoveWear={removeWear}
          expanded={expandedWears}
          onToggleExpanded={() => setExpandedWears((value) => !value)}
        />

        <GapsPanel variant="section" gaps={gaps} onApply={applyGap} />

        <PlaybookPanel
          items={items}
          summaries={summaries}
          onFilterStyle={filterStyle}
          onFilterAudit={filterAudit}
          onLoadPreset={loadPreset}
        />

        <TemplatePanel
          itemCount={items.length}
          onImport={importText}
          onExport={exportWardrobe}
          onDownloadTemplate={() => {
            void downloadTemplate();
          }}
          onCopyTemplate={() => {
            void copyTemplate();
          }}
          onRestoreSamples={restoreSamples}
          onStartEmpty={startEmpty}
        />
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <p className="footer__mark">DigiWard</p>
            <p className="footer__note">
              A local-first wardrobe index, built to the standards recorded in AGENTS.md, ANTI-AI.md and
              LEGALITIES.md.
            </p>
          </div>

          <nav className="footer__links" aria-label="Footer">
            <a href="#catalogue">Wardrobe</a>
            <a href="#rotation">Rotation</a>
            <a href="#gaps">Gaps</a>
            <a href="#playbook">Playbook</a>
            <a href="#template">Template</a>
            <a href="https://github.com/divitgangrade-lab/DigiWard" rel="noopener noreferrer">
              Source
            </a>
          </nav>

          <details className="legal">
            <summary>Privacy, accessibility and disclaimers</summary>
            <div className="legal__body">
              <p>
                <strong>Privacy.</strong> DigiWard runs entirely in this browser. There are no accounts, no
                analytics, no cookies and no requests to third parties after the page loads. Your wardrobe is
                stored in local storage on this device, and exports are created locally.
              </p>
              <p>
                <strong>Accessibility.</strong> The interface targets WCAG 2.2 AA: keyboard operation
                throughout, visible focus, 4.5:1 text contrast, labelled fields, native modal dialogs, and a
                static image instead of the animated hero when reduced motion is requested. The gooey
                navigation drops its particles and the target reticle is not rendered under reduced motion;
                the native cursor is never hidden. Known limitation: the hero canvas is decorative only, and
                every piece of information it implies is available as text.
              </p>
              <p>
                <strong>Disclaimer.</strong> This is a wardrobe organiser, not fashion, financial or shopping
                advice. Sample entries are illustrative. Delete them before relying on the gap report.
              </p>
            </div>
          </details>

          <p className="footer__copy">© 2026 DigiWard. Sample entries are illustrative, not the owner's clothes.</p>
        </div>
      </footer>

      {activeItem !== null && activeSummary !== null ? (
        <Dialog open labelledBy="item-dialog-title" onClose={closeDialog} className="dialog--item">
          <ItemDialog
            item={activeItem}
            summary={activeSummary}
            onClose={closeDialog}
            onEdit={() => setDialog({ kind: 'edit', id: activeItem.id })}
            onLogWear={() => logWear(activeItem.id)}
            onRemove={() => removeItem(activeItem.id)}
          />
        </Dialog>
      ) : null}

      {dialog?.kind === 'add' || dialog?.kind === 'edit' ? (
        <Dialog open labelledBy="item-form-title" onClose={closeDialog} className="dialog--form">
          <ItemForm
            key={dialog.kind === 'edit' ? dialog.id : 'new'}
            item={dialog.kind === 'edit' ? editingItem : undefined}
            onSave={saveItem}
            onCancel={closeDialog}
          />
        </Dialog>
      ) : null}

      <TargetCursor />
    </div>
  );
}
