// PlatformAdapter backed by localStorage — persists high score locally in the browser.
// Gracefully handles missing/quota-exceeded storage (private browsing, etc.).
import PlatformAdapter from './PlatformAdapter.js';
import { STORAGE_KEY } from '../config/gameConfig.js';

export default class LocalStorageAdapter extends PlatformAdapter {
  // No setup needed for localStorage — always ready.
  async init() {
    return true;
  }

  // Read the score from localStorage, with safe fallback to 0 on missing/corrupt data.
  async getHighScore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const value = raw === null ? 0 : JSON.parse(raw);
      return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  // Write the score to localStorage; silently ignores storage errors.
  async setHighScore(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // storage unavailable (private browsing, quota, etc) — fail silently, non-critical data
    }
  }

  // Remove the stored score key from localStorage.
  async clearData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
  }
}
