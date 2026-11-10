import type { ReactNode } from 'react';

interface BaseProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

const describedBy = (id: string, hint?: string, error?: string): string | undefined => {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(
    (value): value is string => value !== null,
  );
  return ids.length > 0 ? ids.join(' ') : undefined;
};

export function FieldMessages({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </>
  );
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  type?: 'text' | 'search' | 'url';
  inputMode?: 'text' | 'numeric';
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  placeholder,
  maxLength,
  autoFocus,
  type = 'text',
  inputMode,
}: TextFieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? <span className="field__req"> (required)</span> : null}
      </label>
      <FieldMessages id={id} hint={hint} error={error} />
      <input
        id={id}
        className="field__input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        inputMode={inputMode}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </div>
  );
}

interface TextAreaFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  rows = 3,
  maxLength,
  placeholder,
}: TextAreaFieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? <span className="field__req"> (required)</span> : null}
      </label>
      <FieldMessages id={id} hint={hint} error={error} />
      <textarea
        id={id}
        className="field__input field__input--area"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </div>
  );
}

interface CommonSelectProps<T extends string> extends BaseProps {
  value: string;
  options: readonly { value: T; label: string }[];
  includeEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}

type SelectFieldProps<T extends string> = CommonSelectProps<T> &
  (
    | { includeEmpty: true; onChange: (value: T | '') => void }
    | { includeEmpty?: false; onChange: (value: T) => void }
  );

export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  const { id, label, value, options, includeEmpty, emptyLabel = 'Any', className, hint, error } = props;

  const handleChange = (raw: string) => {
    if (raw === '') {
      if (props.includeEmpty === true) (props.onChange as (value: T | '') => void)('');
      return;
    }
    (props.onChange as (value: T) => void)(raw as T);
  };
  return (
    <div className={className ? `field ${className}` : 'field'}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <select
        id={id}
        className="field__input field__input--select"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      >
        {includeEmpty ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface CheckboxGroupProps<T extends string> {
  id: string;
  legend: string;
  hint?: string;
  options: readonly { value: T; label: string }[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}

export function CheckboxGroup<T extends string>({
  id,
  legend,
  hint,
  options,
  selected,
  onToggle,
}: CheckboxGroupProps<T>) {
  return (
    <fieldset className="field field--set">
      <legend className="field__label">{legend}</legend>
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <div className="check-grid">
        {options.map((option) => (
          <label className="check" key={option.value} htmlFor={`${id}-${option.value}`}>
            <input
              id={`${id}-${option.value}`}
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              aria-describedby={hint ? `${id}-hint` : undefined}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>;
}
