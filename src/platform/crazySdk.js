// Thin wrapper around the CrazyGames SDK global (`window.CrazyGames`, loaded via the
// <script> tag in index.html). Every export is guarded so the game behaves identically
// when the SDK script fails to load or isn't running on a CrazyGames-served page (local
// dev, GitHub Pages, itch.io, etc.) — callers never need to check availability themselves.
let readyPromise = null;

// Runs window.CrazyGames.SDK.init() exactly once and caches the result. Resolves true
// once the SDK is ready to use, false if it's missing or init() throws.
export function initSdk() {
  if (!readyPromise) {
    readyPromise = (async () => {
      if (typeof window === 'undefined' || !window.CrazyGames?.SDK) return false;
      try {
        await window.CrazyGames.SDK.init();
        return true;
      } catch {
        return false;
      }
    })();
  }
  return readyPromise;
}

// Signals to the CrazyGames loading screen that game content is being fetched.
// Call at the start of asset preloading and again once loading completes.
export async function loadingStart() {
  if (await initSdk()) window.CrazyGames.SDK.game.loadingStart();
}
export async function loadingStop() {
  if (await initSdk()) window.CrazyGames.SDK.game.loadingStop();
}

// Signals active gameplay start/stop — used by CrazyGames to avoid resource-intensive
// site actions while a session is in progress. Menus, pause, and results screens all
// count as "stopped"; only live GameScene play counts as "started".
export async function gameplayStart() {
  if (await initSdk()) window.CrazyGames.SDK.game.gameplayStart();
}
export async function gameplayStop() {
  if (await initSdk()) window.CrazyGames.SDK.game.gameplayStop();
}

// Applies the SDK's current muteAudio setting to a Phaser SoundManager and keeps it in
// sync with future changes. muteAudio must override any in-game sound/music toggle, so
// this is wired independently of AudioSettings. No-ops off-platform.
export async function syncMuteSetting(soundManager) {
  if (!(await initSdk())) return;
  const { game } = window.CrazyGames.SDK;
  soundManager.mute = Boolean(game.settings.muteAudio);
  game.addSettingsChangeListener((settings) => {
    soundManager.mute = Boolean(settings.muteAudio);
  });
}
