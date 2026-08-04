# CrazyGames launch progress

Working log for the CrazyGames submission — what's shipped, what broke and why, and the
checklist for Full Launch once Basic Launch QA clears. Keep this in sync the same way as
README/ARCHITECTURE: update it in the commit that changes the relevant integration code.

## Status

Basic Launch build submitted to QA (2026-08-04). Awaiting review.

## Fixed so far

- **SDK integration** — `src/platform/crazySdk.js` wraps `window.CrazyGames.SDK`
  (script tag in `index.html`, v3). `loadingStart/Stop`, `gameplayStart/Stop`,
  `syncMuteSetting`, and `requestMidgameAd` are wired at the right call sites
  (`BootScene`, `GameScene`). Every export no-ops off-platform.
- **High score persistence** — `CrazyGamesAdapter` uses `SDK.data` with a
  `localStorage` mirror/fallback (see the comment block at the top of that file for why
  both are needed).
- **Midgame ads** — requested once per round end (`GameScene.endBoard()`), covering
  both outcomes (board cleared / run over), matching CrazyGames' documented ad
  placement guidance. Gameplay is paused and audio muted around the ad
  (`onStart`/`onEnd` in `requestMidgameAd`).
- **Blank canvas / "SDK not detected" in QA preview** — root cause was
  `vite.config.js`'s `base: '/UnderConstruction/'` (set for GitHub Pages), which made
  the built `index.html` load `/UnderConstruction/assets/index-*.js` — an absolute path
  that 404s under CrazyGames' own hosting path. Fixed by switching to `base: './'`
  (relative), which resolves correctly on both hosts. See `CLAUDE.md` Deployment
  section.
- **Zip upload rejected** — the portal's upload widget takes a folder drag-drop, not a
  zip archive. Upload `dist/`'s contents directly.

## Full Launch checklist

Basic Launch has ads disabled and is time-limited/limited-audience by design — this is
the list to clear before requesting Full Launch review.

### SDK / gameplay
- [ ] **Rewarded ad hookup** (`SDK.ad.requestAd('rewarded', …)`) — not implemented.
      Needs a reward moment to attach to first; there's currently no continue/retry
      mechanic. Decide the reward (extra life / continue after game over / bonus
      starting balls) before wiring the call — this is a gameplay design decision, not
      just plumbing.
- [ ] **User module** (`SDK.user` — profile/account linking) — optional, only worth it
      if we want CrazyGames-account-backed high scores instead of/alongside the
      anonymous `SDK.data` sync already in place.
- [ ] Confirm `SDK.data` calls (`Get Item`/`Set Item`) actually register outside the QA
      sandbox — they didn't light up in the QA panel's SDK functionality tracker even
      though `MenuScene.loadHighScore()` calls them on every load. Likely just the QA
      sandbox gating the data module (ads are documented as disabled there too), but
      confirm once live.

### Technical requirements (from docs.crazygames.com/requirements/technical)
- [ ] **Disable page scroll on Space/Arrow keys and wheel** — required so embedding on
      the CrazyGames page doesn't scroll the site instead of / in addition to the game
      reacting to Space (drop release) or arrow keys. Not yet added to `index.html` or
      `main.js`:
      ```js
      window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
      window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
      });
      ```
- [ ] **Mobile long-press/double-tap magnifier prevention** — add to the `body` CSS in
      `index.html`:
      ```css
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      ```
- [ ] **Verify on Safari and Chromebook (4GB RAM)** — required device/browser coverage
      for Full Launch; game currently only manually verified on Chromium.
- [ ] **Verify touch input end-to-end on a real mobile device** — Phaser's pointer
      events should cover this for free (drop release is `pointerdown`), but hasn't
      been device-tested.

### Store listing assets
- [ ] **Game covers** — need all three: 1920×1080 (landscape), 800×1200 (portrait),
      800×800 (square). Consistent visuals across all three; avoid a plain screenshot
      per CrazyGames' own guidance (hero art / big title treatment preferred). Board is
      natively 9:16 (480×853, portrait) — landscape/square covers need original
      artwork, not just a crop.
- [ ] **15–20s preview video** (auto-cut to 20s if longer) — not yet captured. See prior
      discussion: `npm run dev` + Windows Game Bar (`Win+Alt+R`) is the quick path.
- [ ] **Store description** — drafted, not yet finalized/placed. See conversation log
      for the current draft (short + full versions).

### Compliance
- [ ] **Privacy notice** — only needed if the game collects personal data beyond what
      the SDK modules already cover. Currently doesn't (no forms, no external
      analytics), so likely not applicable — confirm before Full Launch review.
- [ ] **Sitelock** — optional, protects against the game files being copied to other
      sites. Not implemented; low priority for a free/no-monetization-outside-CrazyGames
      game, skip unless piracy becomes a real problem.

## Non-issues (checked, no action needed)
- Total build size: 3.5 MB — nowhere near the 50 MB (or 20 MB mobile-homepage) budget,
  no need to code-split despite the `manualChunks` build warning.
- Font-resolution build warnings (`fonts/*.woff2 didn't resolve at build time`) — fonts
  live in `public/fonts/`, copied verbatim by Vite; cosmetic only.
