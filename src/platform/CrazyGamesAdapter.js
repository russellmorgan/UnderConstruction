// PlatformAdapter backed by the CrazyGames SDK's data module (window.CrazyGames.SDK.data),
// which has the same shape as localStorage but is synced across a logged-in user's
// devices. Falls back to LocalStorageAdapter when the SDK is unavailable (local dev,
// blocked CDN, or a non-CrazyGames deploy) so this class is safe to leave as the
// permanent return value of getActiveAdapter().
//
// The SDK being *present* is not the same as its data module *working*: off-platform
// (GitHub Pages, itch.io) SDK.init() resolves fine but every data call throws
// dataModuleDisabled. Swallowing those writes silently reset the house record to 0 on
// every read, so ResultsScene thought each run beat the record and always showed the
// NEW HOUSE RECORD banner. Writes therefore always mirror to localStorage, and reads
// take the higher of the two — the SDK stays authoritative for cross-device sync when
// it works, and local storage carries the record when it doesn't.
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
    const local = await this.#fallback.getHighScore();
    if (!this.#ready) return local;
    let remote = 0;
    try {
      const raw = window.CrazyGames.SDK.data.getItem(STORAGE_KEY);
      const value = raw === null || raw === undefined ? 0 : JSON.parse(raw);
      if (typeof value === 'number' && Number.isFinite(value)) remote = value;
    } catch {
      // data module disabled/unavailable — the localStorage mirror is the record
    }
    return Math.max(local, remote);
  }

  async setHighScore(value) {
    await this.#fallback.setHighScore(value);
    if (!this.#ready) return;
    try {
      window.CrazyGames.SDK.data.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // dataLimitExcedeed / dataModuleDisabled / other — localStorage mirror already holds it
    }
  }

  async clearData() {
    await this.#fallback.clearData();
    if (!this.#ready) return;
    try {
      window.CrazyGames.SDK.data.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
  }
}
