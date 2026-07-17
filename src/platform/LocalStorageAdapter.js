import PlatformAdapter from './PlatformAdapter.js';
import { STORAGE_KEY } from '../config/gameConfig.js';

export default class LocalStorageAdapter extends PlatformAdapter {
  async init() {
    return true;
  }

  async getHighScore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const value = raw === null ? 0 : JSON.parse(raw);
      return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  async setHighScore(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // storage unavailable (private browsing, quota, etc) — fail silently, non-critical data
    }
  }

  async clearHighScore() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — fail silently
    }
  }
}
