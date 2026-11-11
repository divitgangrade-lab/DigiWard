import { describe, expect, it } from 'vitest';
import { validateWardrobeFile, validateWardrobeItem } from './validate';

const base = {
  name: 'Oxford shirt',
  category: 'tops',
  color: 'ecru',
  material: 'cotton oxford',
  formality: 'smart-casual',
};

describe('validateWardrobeItem', () => {
  it('accepts the minimal required set and drops optional fields', () => {
    const result = validateWardrobeItem(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.id).toBe('oxford-shirt');
    expect(result.item.seasons).toBeUndefined();
    expect(result.item.wearLog).toBeUndefined();
  });

  it('requires name, colour and material', () => {
    const result = validateWardrobeItem({ category: 'tops', formality: 'casual' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['name', 'color', 'material']),
    );
  });

  it('rejects values outside the schema enums', () => {
    const result = validateWardrobeItem({ ...base, category: 'hats', formality: 'lounge', weather: ['humid'] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain('category must be');
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain('formality must be');
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain('weather contains');
  });

  it('normalises tags and keeps wear dates valid and sorted', () => {
    const result = validateWardrobeItem({
      ...base,
      tags: ['  Winter Evening ', 'winter-evening', 'DESK'],
      wearLog: ['2026-01-02', '2026-03-04', '2026-03-04'],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.tags).toEqual(['winter-evening', 'desk']);
    expect(result.item.wearLog).toEqual(['2026-03-04', '2026-01-02']);
  });

  it('rejects impossible wear dates and unsafe image paths', () => {
    const result = validateWardrobeItem({
      ...base,
      wearLog: ['2026-02-31'],
      image: 'javascript:alert(1)',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['wearLog', 'image']),
    );
  });

  it('accepts style, core, price and audit fields and rounds the price', () => {
    const result = validateWardrobeItem({
      ...base,
      styles: ['minimalist-classic', 'black-tie'],
      core: true,
      price: '89.456',
      audit: 'alter',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.styles).toEqual(['minimalist-classic', 'black-tie']);
    expect(result.item.core).toBe(true);
    expect(result.item.price).toBe(89.46);
    expect(result.item.audit).toBe('alter');
  });

  it('rejects invalid style, core, price and audit values', () => {
    const result = validateWardrobeItem({
      ...base,
      styles: ['not-a-style'],
      core: 'yes',
      price: -1,
      audit: 'bin',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['styles', 'core', 'price', 'audit']),
    );
  });

  it('rejects external image URLs so the no-third-party-requests promise holds', () => {
    const result = validateWardrobeItem({ ...base, image: 'https://example.com/shirt.jpg' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.field).toBe('image');
  });

  it('rejects non-object records', () => {
    expect(validateWardrobeItem(null).ok).toBe(false);
    expect(validateWardrobeItem([base]).ok).toBe(false);
  });

  it('drops unknown keys from imported files', () => {
    const result = validateWardrobeItem({ ...base, tracker: 'https://example.com/pixel' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.item)).not.toContain('tracker');
  });
});

describe('validateWardrobeFile', () => {
  it('keeps valid items and reports each skipped record', () => {
    const result = validateWardrobeFile({
      items: [base, { name: 'Broken' }, { ...base, name: 'Second shirt' }],
    });
    expect(result.items).toHaveLength(2);
    expect(result.skipped).toBe(1);
    expect(result.issues[0]?.field.startsWith('items[1]')).toBe(true);
  });

  it('de-duplicates ids so React keys stay unique', () => {
    const result = validateWardrobeFile({ items: [base, base, base] });
    expect(result.items.map((item) => item.id)).toEqual([
      'oxford-shirt',
      'oxford-shirt-2',
      'oxford-shirt-3',
    ]);
  });

  it('accepts a bare list and rejects unrelated shapes', () => {
    expect(validateWardrobeFile([base]).items).toHaveLength(1);
    expect(validateWardrobeFile({ nope: [] }).issues[0]?.field).toBe('file');
    expect(validateWardrobeFile('[]').items).toEqual([]);
  });
});
