// Stub PlatformAdapter for future CrazyGames SDK integration — matches the adapter shape
// so switching getActiveAdapter() to this class is a one-line config change. Not wired up.
import PlatformAdapter from './PlatformAdapter.js';

// Placeholder only — matches PlatformAdapter's shape so switching getActiveAdapter()
// to this class later is a one-line config change, not a rewrite.
// Do not wire up real CrazyGames SDK calls from memory; check the current SDK docs
// (method names, init sequence, data API) at integration time.
export default class CrazyGamesAdapter extends PlatformAdapter {
  // TODO: implement against CrazyGames SDK.
  async init() {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
    return true;
  }

  // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
  async getHighScore() {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
    return 0;
  }

  // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
  async setHighScore(value) {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
  }

  // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
  async clearData() {
    // TODO: implement against CrazyGames SDK — verify current API surface at integration time, do not assume method names from memory.
  }
}
