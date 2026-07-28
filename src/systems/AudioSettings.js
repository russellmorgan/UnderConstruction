// Player sound/music preferences, persisted to localStorage. Plain booleans, no
// platform adapter needed — this is a local UI toggle, not synced game data.
const SOUND_KEY = 'midway-drop:soundOn';
const MUSIC_KEY = 'midway-drop:musicOn';

function readFlag(key) {
  try {
    return localStorage.getItem(key) !== '0';
  } catch {
    return true;
  }
}

function writeFlag(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // storage unavailable — setting just won't persist across reloads
  }
}

export function isSoundOn() {
  return readFlag(SOUND_KEY);
}

export function isMusicOn() {
  return readFlag(MUSIC_KEY);
}

export function toggleSound() {
  const next = !isSoundOn();
  writeFlag(SOUND_KEY, next);
  return next;
}

// Music playback doesn't exist yet — this only persists the preference for when it does.
export function toggleMusic() {
  const next = !isMusicOn();
  writeFlag(MUSIC_KEY, next);
  return next;
}
