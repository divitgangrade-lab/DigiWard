import { describe, expect, it } from 'vitest';
import { CAPSULE_PRESETS, PRESET_ITEMS, presetItem } from './presets';
import { validateWardrobeFile } from '../domain/validate';
import { CAPSULE_54321 } from '../domain/playbook';

describe('capsule presets', () => {
  it('ships only schema-valid, uniquely identified items', () => {
    const result = validateWardrobeFile({ items: PRESET_ITEMS });
    expect(result.issues).toEqual([]);
    expect(result.skipped).toBe(0);
    expect(new Set(PRESET_ITEMS.map((item) => item.id)).size).toBe(PRESET_ITEMS.length);
    expect(PRESET_ITEMS.every((item) => item.example === true)).toBe(true);
  });

  it('resolves every id in every preset without duplicates', () => {
    for (const preset of CAPSULE_PRESETS) {
      const resolved = preset.itemIds.map((id) => presetItem(id));
      expect(resolved.every((item) => item !== undefined)).toBe(true);
      expect(new Set(preset.itemIds).size).toBe(preset.itemIds.length);
      expect(preset.itemIds.length).toBeGreaterThan(0);
    }
  });

  it('matches the 5-4-3-2-1 promise exactly', () => {
    const preset = CAPSULE_PRESETS.find((entry) => entry.id === 'capsule-54321');
    expect(preset).toBeDefined();
    if (!preset) return;
    const counts: Record<string, number> = {};
    for (const id of preset.itemIds) {
      const item = presetItem(id);
      expect(item).toBeDefined();
      if (item) counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    expect(counts).toEqual(CAPSULE_54321);
  });
});
