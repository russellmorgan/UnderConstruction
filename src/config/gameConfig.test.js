import { describe, it, expect } from 'vitest';
import { PEG_TEMPLATES } from './gameConfig.js';

describe('PEG_TEMPLATES', () => {
  // A template with an empty column running its full depth lets a ball drop into a
  // slot without touching a peg. Two full-width rows make that impossible.
  it('every template blocks a straight vertical drop', () => {
    for (const { id, rows } of PEG_TEMPLATES) {
      const width = Math.max(...rows.map((r) => r.length));
      const solid = rows.filter((r) => r.length === width && !r.includes('.'));
      expect(solid.length, `${id} needs 2+ full-width rows`).toBeGreaterThanOrEqual(2);
    }
  });

  it('no two consecutive full-width solid rows', () => {
    for (const { id, rows } of PEG_TEMPLATES.filter((t) => t.id !== 'full')) {
      const width = Math.max(...rows.map((r) => r.length));
      const isSolid = (r) => r.length === width && !r.includes('.');
      for (let i = 1; i < rows.length; i++) {
        expect(isSolid(rows[i]) && isSolid(rows[i - 1]), `${id} row ${i}`).toBe(false);
      }
    }
  });
});
