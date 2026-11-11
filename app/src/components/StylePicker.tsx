import { STYLES, STYLE_GROUPS, STYLE_LABELS, stylesInGroup, type StyleId } from '../domain/styles';

interface StylePickerProps {
  selected: readonly StyleId[];
  onToggle: (style: StyleId) => void;
}

/**
 * The full taxonomy is long, so it stays behind a disclosure and the chosen
 * tags remain visible as removable chips. Checkboxes are the controls, so
 * keyboard and screen-reader behaviour is the native one.
 */
export function StylePicker({ selected, onToggle }: StylePickerProps) {
  return (
    <fieldset className="item-form__group style-picker">
      <legend className="item-form__legend">Style &amp; dress code</legend>
      <p className="field__hint" id="item-form-styles-hint">
        Optional. Pick the aesthetics and dress codes this piece belongs to. Style is separate from
        formality: a leather jacket can be casual and punk.
      </p>

      {selected.length > 0 ? (
        <ul className="chip-list" aria-label="Selected styles">
          {selected.map((style) => (
            <li key={style}>
              <button
                type="button"
                className="chip chip--removable"
                onClick={() => onToggle(style)}
                aria-label={`Remove ${STYLE_LABELS[style]}`}
              >
                {STYLE_LABELS[style]} <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="style-picker__disclosure">
        <summary>
          Choose style tags <span className="style-picker__count">{selected.length} selected</span>
        </summary>
        <div className="style-picker__groups">
          {STYLE_GROUPS.map((group) => {
            const styles = stylesInGroup(group.id);
            return (
              <fieldset className="style-picker__group" key={group.id}>
                <legend>{group.label}</legend>
                <p className="style-picker__note">{group.note}</p>
                <div className="check-grid">
                  {styles.map((style) => {
                    const id = `style-${style.id}`;
                    return (
                      <label className="check" key={style.id} htmlFor={id}>
                        <input
                          id={id}
                          type="checkbox"
                          checked={selected.includes(style.id)}
                          onChange={() => onToggle(style.id)}
                          aria-describedby="item-form-styles-hint"
                        />
                        <span>{style.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      </details>
      <p className="field__hint">
        {STYLES.length} styles across {STYLE_GROUPS.length} families. You can change these at any time.
      </p>
    </fieldset>
  );
}
