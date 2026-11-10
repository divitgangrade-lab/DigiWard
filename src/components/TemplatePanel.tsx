import { useState } from 'react';
import { FIELD_GUIDE } from '../domain/template';

interface TemplatePanelProps {
  itemCount: number;
  onImport: (text: string) => void;
  onExport: () => void;
  onDownloadTemplate: () => void;
  onCopyTemplate: () => void;
  onRestoreSamples: () => void;
  onStartEmpty: () => void;
}

const SAMPLE_ITEM = `{
  "name": "Waxed field jacket",
  "category": "outerwear",
  "color": "olive",
  "material": "waxed cotton",
  "formality": "casual",
  "occasions": ["outdoors"],
  "weather": ["wet", "cool"],
  "moods": ["relaxed"],
  "fitNotes": "Roomy across the shoulders.",
  "tags": ["rain-layer"]
}`;

const fillFirst = FIELD_GUIDE.filter((entry) => entry.importance === 'fill first');
const rest = FIELD_GUIDE.filter((entry) => entry.importance !== 'fill first');

export function TemplatePanel({
  itemCount,
  onImport,
  onExport,
  onDownloadTemplate,
  onCopyTemplate,
  onRestoreSamples,
  onStartEmpty,
}: TemplatePanelProps) {
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<'restore' | 'empty' | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_000_000) {
      setFileMessage('That file is larger than 2 MB. A wardrobe export should be far smaller.');
      return;
    }
    try {
      const text = await file.text();
      setFileMessage(null);
      onImport(text);
    } catch {
      setFileMessage('The file could not be read. Try exporting it again.');
    }
  };

  return (
    <section className="section" id="template" aria-labelledby="template-title">
      <div className="section__head">
        <h2 id="template-title">The item template</h2>
        <p>
          One JSON object per garment, in one list. Fill the seven fields below first: they are what occasion,
          weather and mood filtering actually reads. Everything else sharpens the result but is safe to skip.
        </p>
      </div>

      <div className="template-layout">
        <div className="template-main">
          <h3 className="subhead">Fill these first</h3>
          <table className="guide">
            <caption className="visually-hidden">Fields that drive outfit suggestions</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Priority</th>
                <th scope="col">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {fillFirst.map((entry) => (
                <tr key={entry.field}>
                  <th scope="row">
                    <code>{entry.field}</code>
                  </th>
                  <td>{entry.importance}</td>
                  <td>{entry.why}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className="disclosure">
            <summary>Optional fields and what they change</summary>
            <table className="guide">
              <caption className="visually-hidden">Optional fields</caption>
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((entry) => (
                  <tr key={entry.field}>
                    <th scope="row">
                      <code>{entry.field}</code>
                    </th>
                    <td>{entry.importance}</td>
                    <td>{entry.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <h3 className="subhead">A minimal, valid item</h3>
          <p className="muted">
            This is enough for filtering. The app fills in an id and an empty wear log when you import it.
          </p>
          <pre className="code-sample">
            <code>{SAMPLE_ITEM}</code>
          </pre>
        </div>

        <aside className="rail" aria-label="Template files and data">
          <div className="rail-card">
            <h3 className="rail-card__title">Template files</h3>
            <p className="rail-card__note">
              The downloadable template includes every field, a notes block, and the import rules.
            </p>
            <div className="stack">
              <button type="button" className="button button--primary" onClick={onDownloadTemplate}>
                Download the template
              </button>
              <button type="button" className="button" onClick={onCopyTemplate}>
                Copy template JSON
              </button>
              <button type="button" className="button" onClick={onExport}>
                Export my wardrobe ({itemCount})
              </button>
              <label className="button button--quiet" htmlFor="import-file">
                Import a JSON file
              </label>
              <input
                id="import-file"
                className="visually-hidden"
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>
            {fileMessage ? (
              <p className="field__error" role="alert">
                {fileMessage}
              </p>
            ) : null}
            <p className="rail-card__note">
              Imports keep valid items and skip broken ones, then report how many of each.
            </p>
          </div>

          <div className="rail-card">
            <h3 className="rail-card__title">This browser</h3>
            <p className="rail-card__note">
              Your wardrobe lives in this browser's local storage. Export a file before switching device or
              clearing site data.
            </p>
            {pending === null ? (
              <div className="stack">
                <button type="button" className="button button--quiet" onClick={() => setPending('restore')}>
                  Restore the samples
                </button>
                <button type="button" className="button button--quiet" onClick={() => setPending('empty')}>
                  Start an empty wardrobe
                </button>
              </div>
            ) : (
              <div className="confirm">
                <p>
                  {pending === 'restore'
                    ? 'Replace the current wardrobe with the 14 sample entries?'
                    : 'Remove every piece from this browser? Export first if you want a copy.'}
                </p>
                <div className="dialog__actions">
                  <button
                    type="button"
                    className={pending === 'empty' ? 'button button--danger' : 'button button--primary'}
                    onClick={() => {
                      if (pending === 'restore') onRestoreSamples();
                      else onStartEmpty();
                      setPending(null);
                    }}
                  >
                    {pending === 'restore' ? 'Restore samples' : 'Remove everything'}
                  </button>
                  <button type="button" className="button button--quiet" onClick={() => setPending(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
