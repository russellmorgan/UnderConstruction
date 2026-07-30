// Sound/music on/off preferences — persisted to localStorage as local UI toggles, not
// synced game data. Not part of the platform adapter since these are player settings,
// not session storage.
// platform adapter needed — this is a local UI toggle, not synced game data.
const SOUND_KEY = 'midway-drop:soundOn';
const MUSIC_KEY = 'midway-drop:musicOn';

// Read a boolean flag from localStorage; defaults to true (on).
function readFlag(key) {
  try {
    return localStorage.getItem(key) !== '0';
  } catch {
    return true;
  }
}

// Write a boolean flag to localStorage as "1" or "0".
function writeFlag(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // storage unavailable — setting just won't persist across reloads
  }
}

// Returns true if sound effects are enabled.
export function isSoundOn() {
  return readFlag(SOUND_KEY);
}

// Returns true if music is enabled.
export function isMusicOn() {
  return readFlag(MUSIC_KEY);
}

// Flip the sound toggle and return the new state.
export function toggleSound() {
  const next = !isSoundOn();
  writeFlag(SOUND_KEY, next);
  return next;
}

// Music playback doesn't exist yet — this only persists the preference for when it does.
// Flip the music toggle and return the new state. Music playback doesn't exist yet.
export function toggleMusic() {
  const next = !isMusicOn();
  writeFlag(MUSIC_KEY, next);
  return next;
}
