import type { WardrobeItem } from '../domain/schema';
import { validateWardrobeFile } from '../domain/validate';
import { EXAMPLE_ITEMS } from '../data/seed';
import { templateFields } from '../domain/template';

export const STORAGE_KEY = 'digiward.wardrobe.v1';

export interface LoadOutcome {
  items: WardrobeItem[];
  origin: 'browser' | 'examples';
  storageAvailable: boolean;
  notice?: string;
}

export interface SaveOutcome {
  ok: boolean;
  message?: string;
}

const storageAvailable = (): boolean => {
  try {
    const probe = '__digiward_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

const exampleCopy = (): WardrobeItem[] => EXAMPLE_ITEMS.map((item) => ({ ...item }));

/**
 * Reads the saved wardrobe. A corrupt or outdated save is never thrown away
 * silently: the app falls back to the sample catalogue and says so.
 */
export const loadWardrobe = (): LoadOutcome => {
  const available = storageAvailable();
  if (!available) {
    return {
      items: exampleCopy(),
      origin: 'examples',
      storageAvailable: false,
      notice: 'This browser blocks local storage, so changes cannot be saved. Browsing still works.',
    };
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      items: exampleCopy(),
      origin: 'examples',
      storageAvailable: false,
      notice: 'This browser blocks local storage, so changes cannot be saved. Browsing still works.',
    };
  }

  if (raw === null) return { items: exampleCopy(), origin: 'examples', storageAvailable: true };

  try {
    const parsed: unknown = JSON.parse(raw);
    const file = validateWardrobeFile(parsed);
    if (file.items.length === 0) {
      // A empty but well-formed save is an empty wardrobe, not corruption.
      if (file.issues.length === 0) {
        return { items: [], origin: 'browser', storageAvailable: true };
      }
      return {
        items: exampleCopy(),
        origin: 'examples',
        storageAvailable: true,
        notice: 'The saved wardrobe could not be read, so the sample catalogue is showing instead.',
      };
    }
    return {
      items: file.items,
      origin: 'browser',
      storageAvailable: true,
      ...(file.skipped > 0
        ? { notice: `${file.skipped} saved ${file.skipped === 1 ? 'item was' : 'items were'} skipped because they did not match the schema.` }
        : {}),
    };
  } catch {
    return {
      items: exampleCopy(),
      origin: 'examples',
      storageAvailable: true,
      notice: 'The saved wardrobe was not valid JSON, so the sample catalogue is showing instead.',
    };
  }
};

export const saveWardrobe = (items: readonly WardrobeItem[]): SaveOutcome => {
  if (!storageAvailable()) {
    return { ok: false, message: 'Local storage is blocked, so this change will disappear on reload.' };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, exportWardrobeJson(items));
    return { ok: true };
  } catch {
    return { ok: false, message: 'The browser refused to save: storage is full or read-only.' };
  }
};

export const clearWardrobe = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the caller already shows the unsaved-changes state.
  }
};

export const buildWardrobeFile = (items: readonly WardrobeItem[]): string =>
  JSON.stringify(
    {
      $version: 1,
      generatedBy: 'DigiWard',
      fields: templateFields(),
      items,
    },
    null,
    2,
  );

export const exportWardrobeJson = (items: readonly WardrobeItem[]): string => buildWardrobeFile(items);

export const downloadText = (filename: string, contents: string, type = 'application/json'): void => {
  const blob = new Blob([contents], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const templateUrl = (): string => `${import.meta.env.BASE_URL}wardrobe-template.json`;

export const fetchTemplate = async (): Promise<string> => {
  const response = await fetch(templateUrl(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Template request failed with ${response.status}.`);
  return response.text();
};
