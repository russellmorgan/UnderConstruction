import PlatformAdapter from './PlatformAdapter.js';

// Placeholder only — matches PlatformAdapter's shape so switching getActiveAdapter()
// to this class later is a one-line config change, not a rewrite.
// Do not wire up real CrazyGames SDK calls from memory; check the current SDK docs
// (method names, init sequence, data API) at integration time.
export default class CrazyGamesAdapter extends PlatformAdapter {
  async init() {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
    return true;
  }

  async getHighScore() {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
    return 0;
  }

  async setHighScore(value) {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
  }

  async clearData() {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
  }
}
