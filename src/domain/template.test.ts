import { describe, expect, it } from 'vitest';
import { validateWardrobeFile } from './validate';
import { FIELD_GUIDE, FILL_FIRST_FIELDS, templateFields } from './template';
import templateJson from '../../public/wardrobe-template.json';

const template: unknown = templateJson;

const record = template as { _fields: Record<string, string>; _readme: string[]; items: unknown[] };

describe('public/wardrobe-template.json', () => {
  it('imports without a single validation issue', () => {
    const result = validateWardrobeFile(template);
    expect(result.issues).toEqual([]);
    expect(result.skipped).toBe(0);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe('Replace with the garment name');
  });

  it('documents exactly the fields the interface guides', () => {
    expect(record._fields).toEqual(templateFields());
    expect(Object.keys(record._fields).sort()).toEqual(FIELD_GUIDE.map((entry) => entry.field).sort());
  });

  it('marks the fields that drive outfit suggestions as fill first', () => {
    for (const field of ['name', 'category', 'color', 'formality', 'occasions', 'weather', 'moods']) {
      expect(FILL_FIRST_FIELDS).toContain(field);
    }
    expect(record._fields['fitNotes']).toBe('improves suggestions');
    expect(record._fields['care']).toBe('optional');
    expect(record._readme.length).toBeGreaterThanOrEqual(4);
  });
});
