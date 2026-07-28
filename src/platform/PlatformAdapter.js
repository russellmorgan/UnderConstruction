// Interface every platform adapter must implement. Methods are async so a
// cloud-backed adapter (e.g. CrazyGames) can do network I/O without changing
// the shape callers depend on.
export default class PlatformAdapter {
  async init() {
    throw new Error('PlatformAdapter.init() not implemented');
  }

  async getHighScore() {
    throw new Error('PlatformAdapter.getHighScore() not implemented');
  }

  async setHighScore(value) {
    throw new Error('PlatformAdapter.setHighScore() not implemented');
  }

  async clearData() {
    throw new Error('PlatformAdapter.clearData() not implemented');
  }
}
