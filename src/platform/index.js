import LocalStorageAdapter from './LocalStorageAdapter.js';

// The one line that flips when we're ready to integrate CrazyGames:
// swap in CrazyGamesAdapter here once its methods are actually implemented.
export function getActiveAdapter() {
  return new LocalStorageAdapter();
}
