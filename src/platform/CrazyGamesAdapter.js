// PlatformAdapter backed by the CrazyGames SDK's data module (window.CrazyGames.SDK.data),
// which has the same shape as localStorage but is synced across a logged-in user's
// devices. Falls back to LocalStorageAdapter when the SDK is unavailable (local dev,
// blocked CDN, or a non-CrazyGames deploy) so this class is safe to leave as the
// permanent return value of getActiveAdapter().
import PlatformAdapter from './PlatformAdapter.js';
import LocalStorageAdapter from './LocalStorageAdapter.js';
import { STORAGE_KEY } from '../config/gameConfig.js';
import { initSdk } from './crazySdk.js';

export default class CrazyGamesAdapter extends PlatformAdapter {
  #fallback = new LocalStorageAdapter();
  #ready = false;

  // Awaits the shared SDK init (see crazySdk.js). If the SDK is unavailable, transparently
  // switches every subsequent call to the localStorage fallback instead of failing.
  async init() {
    this.#ready = await initSdk();
    if (!this.#ready) await this.#fallback.init();
    return true;
  }

  async getHighScore() {
    if (!this.#ready) return this.#fallback.getHighScore();
    try {
      const raw = window.CrazyGames.SDK.data.getItem(STORAGE_KEY);
      const value = raw === null || raw === undefined ? 0 : JSON.parse(raw);
      return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  async setHighScore(value) {
    if (!this.#ready) return this.#fallback.setHighScore(value);
    try {
      window.CrazyGames.SDK.data.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // dataLimitExcedeed / dataModuleDisabled / other — non-critical, fail silently
    }
  }

  async clearData() {
    if (!this.#ready) return this.#fallback.clearData();
    try {
      window.CrazyGames.SDK.data.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
  }
}
