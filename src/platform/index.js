// Platform adapter factory — the single point where the active adapter is chosen.
// CrazyGamesAdapter falls back to LocalStorageAdapter internally when the SDK isn't
// available, so this stays the permanent choice rather than something to swap later.
import CrazyGamesAdapter from './CrazyGamesAdapter.js';

// Memoized so repeated calls (MenuScene, ResultsScene, ...) share one SDK init instead
// of each re-running it.
let instance = null;

// Return the current platform adapter singleton. Swap the constructor here to switch backends.
export function getActiveAdapter() {
  if (!instance) instance = new CrazyGamesAdapter();
  return instance;
}
