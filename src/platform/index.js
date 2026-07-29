// Platform adapter factory — the single point where the active adapter is chosen.
// Swap to CrazyGamesAdapter here when the SDK integration is ready.
import LocalStorageAdapter from './LocalStorageAdapter.js';

// The one line that flips when we're ready to integrate CrazyGames:
// swap in CrazyGamesAdapter here once its methods are actually implemented.
// Return the current platform adapter singleton. Swap the constructor here to switch backends.
export function getActiveAdapter() {
  return new LocalStorageAdapter();
}
