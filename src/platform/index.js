// Platform adapter factory — the single point where the active adapter is chosen.
import LocalStorageAdapter from './LocalStorageAdapter.js';

// Memoized so repeated calls (MenuScene, ResultsScene, ...) share one instance.
let instance = null;

// Return the current platform adapter singleton.
export function getActiveAdapter() {
  if (!instance) instance = new LocalStorageAdapter();
  return instance;
}
