// Procedural carnival/midway UI kit — all visuals are Graphics, text, and tweens with zero
// image assets. Shared by every screen: tent backdrop, valances, bulb strings, marquee
// frames, sign panels, ticket-stub/toggle buttons, peg texture generators (enamel dome
// tiers + spiked hazard mine), wood posts, vignette, hanging chains, and sway animations.
import Phaser from 'phaser';
import { CARNIVAL } from '../config/gameConfig.js';

// Procedural carnival/midway UI kit. No image assets: everything here is Graphics,
// text and tweens. Shared by every UI surface so the three screens read as one show.

export const FONT_SIGN = '"Rye", Georgia, "Times New Roman", serif';
export const FONT_HUD = '"Work Sans", sans-serif';

// Linear interpolation between two hex colors (t: 0-1).
export function lerpColor(from, to, t) {
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(from),
    Phaser.Display.Color.ValueToColor(to),
    1,
    t
  );
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

// Lighten (positive amount) or darken (negative amount) a hex color.
export function shade(color, amount) {
  return amount >= 0 ? lerpColor(color, 0xffffff, amount) : lerpColor(color, 0x000000, -amount);
}

// Phaser's fillGradientStyle behaves differently per renderer, so gradients here are
// just stacked strips — same look, no renderer surprises.
// Render a vertical colour gradient as stacked rect strips (renderer-independent).
export function gradientRect(g, x, y, w, h, top, bottom, steps = 14) {
  const stepH = h / steps;
  for (let i = 0; i < steps; i++) {
    g.fillStyle(lerpColor(top, bottom, i / (steps - 1)), 1);
    g.fillRect(x, y + i * stepH, w, stepH + 1);
  }
}

// Painted sign lettering: heavy display face, dark outline, drop shadow. Rye is
// already a heavy weight with no real bold face, so unlike the old Georgia default
// this doesn't force fontStyle: 'bold' (that would just synthetically double-stroke it).
// Painted sign text: display face, dark stroke, drop shadow. Centered origin.
export function signText(scene, x, y, label, size, color = CARNIVAL.goldText, extra = {}) {
  return scene.add
    .text(x, y, label, {
      fontFamily: FONT_SIGN,
      fontSize: `${size}px`,
      color,
      stroke: CARNIVAL.inkText,
      strokeThickness: Math.max(2, Math.round(size * 0.14)),
      ...extra,
    })
    .setOrigin(0.5)
    .setShadow(0, 3, 'rgba(0,0,0,0.45)', 4, false, true);
}

// Plain sans-serif HUD text for body copy and descriptions.
export function hudText(scene, x, y, label, size = 13, color = CARNIVAL.cream) {
  return scene.add.text(x, y, label, {
    fontFamily: FONT_HUD,
    fontSize: `${size}px`,
    color,
  });
}

// "Inside the big top": night gradient with faint canvas panels radiating from a
// vanishing point above the board.
// Full-screen tent interior: night gradient, faint canvas wedges radiating from a vanishing point, wood sill at the bottom.
export function tentBackdrop(scene, width, height) {
  const g = scene.add.graphics();
  gradientRect(g, 0, 0, width, height, CARNIVAL.night, CARNIVAL.nightDeep, 18);

  const apexX = width / 2;
  const apexY = -height * 0.4;
  const spread = width * 2.4;
  const wedges = 18;
  for (let i = 0; i < wedges; i += 2) {
    const x0 = apexX - spread / 2 + (spread / wedges) * i;
    g.fillStyle(CARNIVAL.canvasRed, 0.14);
    g.fillTriangle(apexX, apexY, x0, height, x0 + spread / wedges, height);
  }

  g.fillStyle(CARNIVAL.woodDark, 0.5);
  g.fillRect(0, height - 26, width, 26);
  g.fillStyle(CARNIVAL.wood, 0.6);
  g.fillRect(0, height - 26, width, 3);
  return g;
}

// Striped awning strip with a scalloped lower edge — the single most "midway" shape
// available without art, so it anchors the top of every screen.
// Striped awning valance with a scalloped lower edge and a shadow strip below.
export function valance(scene, y, width, depth = 18, stripe = 24) {
  const g = scene.add.graphics();
  const r = stripe / 2;
  const count = Math.ceil(width / stripe);
  for (let i = 0; i < count; i++) {
    const color = i % 2 === 0 ? CARNIVAL.canvasRed : CARNIVAL.canvasCream;
    g.fillStyle(color, 1);
    g.fillRect(i * stripe, y, stripe, depth);
    g.fillCircle(i * stripe + r, y + depth, r);
  }
  g.fillStyle(0x000000, 0.28);
  g.fillRect(0, y + depth + r - 3, width, 4);
  return g;
}

// Compute a point along a quadratic bezier curve for the sagging wire between two points.
function swagPoint(x1, y1, x2, y2, sag, t) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag * 2;
  const inv = 1 - t;
  return {
    x: inv * inv * x1 + 2 * inv * t * cx + t * t * x2,
    y: inv * inv * y1 + 2 * inv * t * cy + t * t * y2,
  };
}

// Swagged string lights. Each bulb flickers on its own clock so the string never
// pulses in lockstep (which reads as a loading spinner, not a fairground).
// Swagged string of flickering bulbs between two points. Each bulb has its own random flicker clock.
export function bulbString(scene, x1, y1, x2, y2, count = 12, sag = 14) {
  const g = scene.add.graphics();
  g.lineStyle(2, CARNIVAL.wire, 1);
  g.beginPath();
  g.moveTo(x1, y1);
  for (let i = 1; i <= 24; i++) {
    const p = swagPoint(x1, y1, x2, y2, sag, i / 24);
    g.lineTo(p.x, p.y);
  }
  g.strokePath();

  const bulbs = [];
  for (let i = 0; i < count; i++) {
    const p = swagPoint(x1, y1, x2, y2, sag, (i + 0.5) / count);
    const bulb = scene.add.circle(p.x, p.y + CARNIVAL.bulbRadius, CARNIVAL.bulbRadius, CARNIVAL.bulbOn);
    scene.tweens.add({
      targets: bulb,
      alpha: { from: 1, to: 0.35 },
      duration: Phaser.Math.Between(CARNIVAL.flickerMin, CARNIVAL.flickerMax),
      delay: Phaser.Math.Between(0, 800),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    bulbs.push(bulb);
  }
  return { graphics: g, bulbs };
}

// Chasing marquee bulbs around a rectangle — the "this is the headline" treatment.
// Chasing marquee bulbs positioned around a rectangle, with staggered phase delays.
export function marqueeFrame(scene, x, y, w, h, spacing = 22) {
  const bulbs = [];
  const points = [];
  const cols = Math.max(2, Math.round(w / spacing));
  const rows = Math.max(2, Math.round(h / spacing));
  for (let i = 0; i < cols; i++) {
    const px = x - w / 2 + (w / (cols - 1)) * i;
    points.push({ x: px, y: y - h / 2 }, { x: px, y: y + h / 2 });
  }
  for (let i = 1; i < rows - 1; i++) {
    const py = y - h / 2 + (h / (rows - 1)) * i;
    points.push({ x: x - w / 2, y: py }, { x: x + w / 2, y: py });
  }

  points.forEach((p, i) => {
    const bulb = scene.add.circle(p.x, p.y, CARNIVAL.bulbRadius + 0.5, CARNIVAL.bulbOn);
    scene.tweens.add({
      targets: bulb,
      alpha: { from: 1, to: 0.25 },
      duration: 520,
      delay: (i % 6) * 130,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    bulbs.push(bulb);
  });
  return bulbs;
}

// Painted board on a gold frame: shadow, frame, gradient field, hairline inlay, rivets.
// Painted sign board on a gold frame: drop shadow, outer frame, inner gradient field, hairline inlay, corner rivets.
export function signPanel(scene, x, y, w, h, opts = {}) {
  const top = opts.top ?? CARNIVAL.panelRed;
  const bottom = opts.bottom ?? CARNIVAL.panelRedDark;
  const radius = opts.radius ?? 10;
  const g = scene.add.graphics();
  const left = x - w / 2;
  const topY = y - h / 2;

  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(left + 3, topY + 5, w, h, radius);

  g.fillStyle(CARNIVAL.gold, 1);
  g.fillRoundedRect(left, topY, w, h, radius);
  g.fillStyle(CARNIVAL.woodDark, 1);
  g.fillRoundedRect(left + 3, topY + 3, w - 6, h - 6, radius - 2);

  gradientRect(g, left + 5, topY + 5, w - 10, h - 10, top, bottom, 12);

  g.lineStyle(1, CARNIVAL.goldLight, 0.7);
  g.strokeRoundedRect(left + 9, topY + 9, w - 18, h - 18, Math.max(2, radius - 6));

  if (opts.rivets !== false) {
    g.fillStyle(CARNIVAL.goldLight, 0.9);
    [
      [left + 9, topY + 9],
      [left + w - 9, topY + 9],
      [left + 9, topY + h - 9],
      [left + w - 9, topY + h - 9],
    ].forEach(([rx, ry]) => g.fillCircle(rx, ry, 2));
  }
  return g;
}

// Ticket-stub button: perforated stub on the left, notched edges, painted label.
// Interactive ticket-stub button: perforated left stub, notched edges, gradient fill, hover/click tweens, and the inner draw(lit) render loop.
export function ticketButton(scene, x, y, w, h, label, onClick, opts = {}) {
  const notchColor = opts.notchColor ?? CARNIVAL.nightDeep;
  const color = opts.color ?? CARNIVAL.gold;
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const text = signText(scene, 6, 0, label, opts.fontSize ?? 20, opts.textColor ?? CARNIVAL.inkText);
  if (opts.textShadow === false) text.setShadow(0, 0, '#000', 0, false, false);
  if (opts.letterSpacing) text.setLetterSpacing(opts.letterSpacing);
  container.add([g, text]);

  const draw = (hot) => {
    g.clear();
    const left = -w / 2;
    const top = -h / 2;

    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(left + 2, top + 4, w, h, 6);

    gradientRect(g, left, top, w, h, hot ? shade(color, 0.25) : color, hot ? color : shade(color, -0.15), 10);

    // notched ticket edges
    g.fillStyle(notchColor, 1);
    g.fillCircle(left, 0, 6);
    g.fillCircle(left + w, 0, 6);

    // perforation between stub and body
    g.lineStyle(1, CARNIVAL.inkText, 0.55);
    const perfX = left + 26;
    for (let ny = top + 6; ny < top + h - 6; ny += 6) {
      g.beginPath();
      g.moveTo(perfX, ny);
      g.lineTo(perfX, ny + 3);
      g.strokePath();
    }
    g.lineStyle(2, CARNIVAL.inkText, hot ? 0.9 : 0.6);
    g.strokeRoundedRect(left + 2, top + 2, w - 4, h - 4, 5);
  };

  draw(false);
  container.setSize(w, h);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerover', () => {
    draw(true);
    scene.tweens.add({ targets: container, scale: 1.05, duration: 110, ease: 'Back.easeOut' });
  });
  container.on('pointerout', () => {
    draw(false);
    scene.tweens.add({ targets: container, scale: 1, duration: 110 });
  });
  container.on('pointerdown', () => container.setY(y + 2));
  container.on('pointerup', () => {
    container.setY(y);
    onClick();
  });
  return container;
}

// A ticketButton that flips between two states on click (e.g. an ON/OFF setting).
// isOn reads current state, onToggle applies the flip; the button re-renders itself
// each click rather than mutating ticketButton's internals.
// Two-state toggle built from ticketButton: re-renders with the current label each time it's toggled.
export function toggleButton(scene, x, y, w, h, labelFor, isOn, onToggle, opts = {}) {
  let current;
  const render = () => {
    if (current) current.destroy();
    current = ticketButton(scene, x, y, w, h, labelFor(isOn()), () => {
      onToggle();
      render();
    }, opts);
    current.setAlpha(isOn() ? 1 : 0.8);
  };
  render();
  return { destroy: () => current.destroy() };
}

// Gentle hanging-sign sway. Anything on a chain or a hook gets one of these.
// Gentle idle sway oscillation — applied to hanging signs and banners.
export function sway(scene, target, degrees = CARNIVAL.swayDegrees) {
  scene.tweens.add({
    targets: target,
    angle: { from: -degrees, to: degrees },
    duration: CARNIVAL.swayDuration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

// Pegs are drawn once into a supersampled texture and stamped as images, so ~60 of them
// cost one draw each instead of a live Graphics shape, and the round edges stay smooth.
const PEG_SS = 4;
export const PEG_TEXTURE_SCALE = 1 / PEG_SS;

// A midway peg: shaded enamel dome, dark seat beneath, optional brass ring and glow for
// the scoring tiers, and a specular highlight so it reads as hardware rather than a dot.
// Generate a supersampled peg texture: shaded enamel dome, dark seat, optional ring/glow for reward tiers, specular highlight.
export function makePegTexture(scene, key, color, opts = {}) {
  if (scene.textures.exists(key)) return key;

  const radius = (opts.radius ?? 6) * PEG_SS;
  const pad = 3 * PEG_SS;
  const size = radius * 2 + pad * 2;
  const c = size / 2;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  if (opts.glow) {
    for (let i = 4; i >= 1; i--) {
      g.fillStyle(opts.ring ?? color, (opts.glow * (5 - i)) / 22);
      g.fillCircle(c, c, radius + i * PEG_SS * 0.7);
    }
  }

  g.fillStyle(CARNIVAL.ink, 0.55);
  g.fillCircle(c, c + PEG_SS * 0.9, radius);

  const highlight = opts.highlight ?? 0.42;
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    g.fillStyle(lerpColor(shade(color, -0.32), shade(color, highlight), t), 1);
    g.fillCircle(c - radius * 0.2 * t, c - radius * 0.24 * t, radius * (1 - t * 0.58));
  }

  if (opts.ring) {
    g.lineStyle(PEG_SS * 1.2, opts.ring, 0.95);
    g.strokeCircle(c, c, radius - PEG_SS * 0.6);
  }

  g.lineStyle(PEG_SS * 0.9, CARNIVAL.ink, 0.5);
  g.strokeCircle(c, c, radius);

  g.fillStyle(0xffffff, opts.specular ?? 0.5);
  g.fillCircle(c - radius * 0.32, c - radius * 0.36, radius * 0.2);

  g.generateTexture(key, size, size);
  g.destroy();
  return key;
}

// The one peg meant to look dangerous rather than desirable: a spiked mine silhouette
// (not a smooth dome, so its outline alone reads as "different") with a black/yellow
// hazard-stripe collar, a hot red core, and a painted "!" — the same warning language
// as real hazard signage, just carnival-painted. The pulsing halo and shiver that make
// it hard to miss from across the board are live tweens on the peg/companion glow in
// PegField, not part of this static texture.
// Generate the hazard-peg texture: spiked mine silhouette, black/yellow stripe collar, red core, painted "!" mark.
export function makeHazardPegTexture(scene, key, opts = {}) {
  if (scene.textures.exists(key)) return key;

  const radius = (opts.radius ?? 6) * PEG_SS;
  const spike = radius * 0.55;
  const pad = spike + 3 * PEG_SS;
  const size = (radius + pad) * 2;
  const c = size / 2;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const spikeCount = 8;
  g.fillStyle(CARNIVAL.hazardBlack, 1);
  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2;
    const baseX = c + Math.cos(a) * radius * 0.92;
    const baseY = c + Math.sin(a) * radius * 0.92;
    const tipX = c + Math.cos(a) * (radius + spike);
    const tipY = c + Math.sin(a) * (radius + spike);
    const perp = a + Math.PI / 2;
    const halfWidth = radius * 0.2;
    g.fillTriangle(
      baseX + Math.cos(perp) * halfWidth,
      baseY + Math.sin(perp) * halfWidth,
      baseX - Math.cos(perp) * halfWidth,
      baseY - Math.sin(perp) * halfWidth,
      tipX,
      tipY
    );
  }

  g.fillStyle(CARNIVAL.ink, 0.6);
  g.fillCircle(c, c + PEG_SS * 0.9, radius);

  const shellSteps = 6;
  for (let i = 0; i < shellSteps; i++) {
    const t = i / (shellSteps - 1);
    g.fillStyle(lerpColor(shade(CARNIVAL.hazardBlack, -0.25), shade(CARNIVAL.hazardBlack, 0.2), t), 1);
    g.fillCircle(c - radius * 0.15 * t, c - radius * 0.18 * t, radius * (1 - t * 0.5));
  }

  // Hazard-stripe collar as thick stroked arc segments (an annulus band), not filled
  // wedges, so the dark core and spikes stay visible inside and outside it.
  const stripeCount = 10;
  const ringRadius = radius * 0.74;
  const ringWidth = radius * 0.46;
  for (let i = 0; i < stripeCount; i++) {
    const a0 = (i / stripeCount) * Math.PI * 2;
    const a1 = ((i + 0.82) / stripeCount) * Math.PI * 2;
    g.lineStyle(ringWidth, i % 2 === 0 ? CARNIVAL.hazardYellow : CARNIVAL.hazardBlack, 1);
    g.beginPath();
    g.arc(c, c, ringRadius, a0, a1, false);
    g.strokePath();
  }

  g.fillStyle(CARNIVAL.hazardRed, 0.95);
  g.fillCircle(c, c, radius * 0.34);
  g.fillStyle(shade(CARNIVAL.hazardRed, 0.5), 0.9);
  g.fillCircle(c - radius * 0.08, c - radius * 0.1, radius * 0.16);

  g.lineStyle(PEG_SS, CARNIVAL.ink, 0.8);
  g.strokeCircle(c, c, radius);

  // Painted "!" — a tapered stem plus a dot, both in warning cream so they hold up
  // against the red core.
  g.fillStyle(0xfff3d6, 1);
  g.fillRoundedRect(c - radius * 0.1, c - radius * 0.5, radius * 0.2, radius * 0.58, radius * 0.06);
  g.fillCircle(c, c + radius * 0.3, radius * 0.13);

  g.generateTexture(key, size, size);
  g.destroy();
  return key;
}

// Weathered upright post — the board's side frame. Grain ticks and brass bolts keep it
// from reading as a flat brown bar.
// Weathered upright post with grain ticks and brass bolt details (side-of-board frame).
export function woodPost(g, x, y, w, h) {
  gradientRect(g, x, y, w, h, CARNIVAL.wood, CARNIVAL.woodDark, 6);
  g.fillStyle(shade(CARNIVAL.wood, 0.25), 0.5);
  g.fillRect(x + 1, y, 1.5, h);
  g.fillStyle(CARNIVAL.woodDark, 0.55);
  for (let ty = y + 14; ty < y + h; ty += 26) {
    g.fillRect(x + 2, ty, w - 4, 1);
  }
  g.fillStyle(CARNIVAL.gold, 0.75);
  for (let by = y + 46; by < y + h - 20; by += 120) {
    g.fillCircle(x + w / 2, by, 2);
  }
}

// Edge falloff so the eye settles on the middle of the board. Stacked alpha bands
// rather than a radial gradient, for the same renderer-independence as gradientRect.
// Vignette edge-darkening via stacked alpha bands — draws the eye to board centre.
export function vignette(scene, w, h, strength = 0.55, depth = 110) {
  const g = scene.add.graphics();
  const steps = 12;
  const band = depth / steps;
  for (let i = 0; i < steps; i++) {
    const alpha = (strength * (1 - i / steps) ** 2) / 4;
    const t = i * band;
    g.fillStyle(0x000000, alpha);
    g.fillRect(0, t, w, band + 1);
    g.fillRect(0, h - t - band - 1, w, band + 1);
    g.fillRect(t, 0, band + 1, h);
    g.fillRect(w - t - band - 1, 0, band + 1, h);
  }
  return g;
}

// Two chains from a rail down to a sign, drawn as linked ticks.
// Two chains hanging from a rail to a sign, drawn as linked dashed ticks.
export function chains(scene, x, y, spread, length) {
  const g = scene.add.graphics();
  g.lineStyle(2, CARNIVAL.wire, 1);
  [-spread / 2, spread / 2].forEach((dx) => {
    for (let i = 0; i < length; i += 6) {
      g.beginPath();
      g.moveTo(x + dx, y + i);
      g.lineTo(x + dx, y + i + 3);
      g.strokePath();
    }
  });
  return g;
}
