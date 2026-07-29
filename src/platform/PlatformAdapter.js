// Abstract platform adapter interface — defines the async shape (init, getHighScore,
// setHighScore, clearData) that all adapters implement so callers never depend on a
// specific backend (localStorage vs Crazy Games cloud).
export default class PlatformAdapter {
  // Initialise the platform backend (e.g. connect to SDK, verify availability). Returns true on success.
  async init() {
    throw new Error('PlatformAdapter.init() not implemented');
  }

  // Retrieve the persisted high score. Returns 0 if none saved.
  async getHighScore() {
    throw new Error('PlatformAdapter.getHighScore() not implemented');
  }

  // Persist a new high score value.
  async setHighScore(value) {
    throw new Error('PlatformAdapter.setHighScore() not implemented');
  }

  // Remove all persisted data (e.g. for a factory reset / privacy request).
  async clearData() {
    throw new Error('PlatformAdapter.clearData() not implemented');
  }
}
