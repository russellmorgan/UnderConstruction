// Core gameplay orchestrator — owns the Matter world, builds the peg field and slots,
// wires together all systems (DropController, ScoreManager, BonusBallManager,
// NarratorSystem, AudioFeedback), handles collision dispatch (peg hits / slot scoring /
// hazard fails / floor safety net), manages ball-in-play lifecycle, stall watchdog, juice
// feedback (particles, shake, flash, popups), and board advancement to BoardCleared or
// Results scene when the session runs out of balls.
//
// A board's per-board earn threshold determines advancement:
//   thresholdForLevel(level) = round(baseThreshold * thresholdGrowth^(level-1))
// Scoring runs through a sublinear CarryMultiplier: only a fraction of a slot's raw
// points reflects the carry boost (payoutFraction), only half the boost survives into
// the next board (carryOverFraction), and repeat hits on the same peg this board taper
// off (repeatHitFactor) so no single board can grind the multiplier straight to its cap.
import Phaser from 'phaser';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PHYSICS,
  SLOTS,
  SESSION,
  JUICE,
  BALL_STALL,
  CARRY,
  CARNIVAL,
  NARRATOR,
  RESULTS,
} from '../config/gameConfig.js';
import GameHud, { DEPTH } from '../ui/GameHud.js';
import { FONT_HUD, FONT_SIGN, lerpColor, tentBackdrop } from '../ui/carnival.js';
import { createPegField } from '../systems/PegField.js';
import { thresholdForLevel } from '../systems/Progression.js';
import CarryMultiplier from '../systems/CarryMultiplier.js';
import DropController from '../systems/DropController.js';
import ScoreManager from '../systems/ScoreManager.js';
import BonusBallManager from '../systems/BonusBallManager.js';
import NarratorSystem from '../systems/NarratorSystem.js';
import AudioFeedback from '../systems/AudioFeedback.js';
import { isMusicOn } from '../systems/AudioSettings.js';
import { FAIL_LINES, ABOVE_THRESHOLD_LINES } from '../data/narratorLines.js';

// thresholdForLevel lives in systems/Progression.js — pure, Phaser-free, unit tested.

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // Carry progression data (level, totalScore, carry multiplier state) across board
  // restarts. The wire format for carryMultiplier stays a plain number — only the
  // in-scene representation is wrapped in a CarryMultiplier instance.
  init(data) {
    this.level = data?.level ?? 1;
    this.totalScore = data?.totalScore ?? 0;
    this.carry = new CarryMultiplier(data?.carryMultiplier ?? CARRY.start);
  }

  // Build the entire board: peg field, slots, floor, walls, HUD, all systems, collision listener, ESC handler.
  create() {
    this.ballsRemaining = SESSION.ballsPerSession;
    this.ballInPlay = false;
    this.boardStartScore = this.totalScore;
    this.boardTarget = thresholdForLevel(this.level);

    tentBackdrop(this, BOARD_WIDTH, BOARD_HEIGHT).setDepth(-1);
    createPegField(this);
    this.hud = new GameHud(this);
    this.createSlots();
    this.createFloor();
    this.createWalls();

    const railStyle = { fontFamily: FONT_HUD, fontSize: '16px', color: CARNIVAL.goldText, fontStyle: 'bold' };
    this.scoreManager = new ScoreManager(this, 84, BOARD_HEIGHT - 26, this.totalScore, {
      style: railStyle,
      label: null,
    });
    this.scoreManager.text.setOrigin(0, 0.5).setDepth(DEPTH.label);

    this.bonusBalls = new BonusBallManager(this.boardTarget);

    this.narrator = new NarratorSystem(this, 0, 0, 292, {
      style: { fontFamily: FONT_HUD, fontSize: '14px', color: CARNIVAL.cream, align: 'center' },
      onChange: (line) => {
        this.hud.setBarkerVisible(Boolean(line));
        if (line) {
          this.hud.setBarkerBelowThreshold(this.totalScore < NARRATOR.scoreThreshold);
        }
      },
    });
    this.narrator.text.setOrigin(0.5);
    this.hud.attachBarkerText(this.narrator.text);

    this.audioFeedback = new AudioFeedback(this);
    this.updateBallsText();
    this.updateBoardText();

    this.carryText = this.add
      .text(BOARD_WIDTH - 12, BOARD_HEIGHT - 26, '', {
        fontFamily: FONT_SIGN,
        fontSize: '13px',
        color: CARNIVAL.goldText,
      })
      .setOrigin(1, 0.5)
      .setDepth(DEPTH.label);
    this.updateCarryText();

    this.createParticleTexture();
    this.scoreParticles = this.add
      .particles(0, 0, 'particleDot', {
        lifespan: 400,
        speed: { min: 60, max: 180 },
        scale: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(DEPTH.effect);

    this.dropController = new DropController(this, (x) => this.spawnBall(x));

    if (isMusicOn()) {
      this.gameMusic = this.sound.add('game_music', { loop: true, volume: 0.2 });
      this.gameMusic.play();
    }
    this.events.on('resume', () => {
      if (isMusicOn() && !this.gameMusic?.isPlaying) {
        this.gameMusic = this.sound.add('game_music', { loop: true, volume: 0.2 });
        this.gameMusic.play();
      } else if (!isMusicOn() && this.gameMusic?.isPlaying) {
        this.gameMusic.stop();
        this.gameMusic = null;
      }
    });
    this.events.on('shutdown', () => {
      if (this.gameMusic) {
        this.gameMusic.stop();
        this.gameMusic = null;
      }
    });

    this.matter.world.on('collisionstart', (event) => this.handleCollisions(event));

    this.input.keyboard.on('keydown-ESC', () => this.pauseGame());

    // ponytail: import.meta.env.DEV is Vite's build-time flag — false in `npm run build`,
    // so these design-preview shortcuts never ship. Bump when adding more debug screens.
    if (import.meta.env.DEV) {
      this.barkerSignVisible = false;
      this.input.keyboard.on('keydown-S', () => {
        this.barkerSignVisible = !this.barkerSignVisible;
        this.hud.setBarkerVisible(this.barkerSignVisible);
        if (this.barkerSignVisible) {
          this.narrator.show(ABOVE_THRESHOLD_LINES[0]);
        }
      });
      this.input.keyboard.on('keydown-B', () => {
        this.scene.start('BoardClearedScene', {
          level: this.level,
          totalScore: this.totalScore,
          carryMultiplier: this.carry.value,
        });
      });
      this.input.keyboard.on('keydown-R', () => {
        this.scene.start('ResultsScene', { score: this.scoreManager.score, level: this.level });
      });
    }
  }

  // Pause physics/update and launch the PauseScene overlay.
  pauseGame() {
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  // Build scoring-zone sensor bodies from SLOTS config, decorate them with booth chrome, track bounds for near-miss detection.
  createSlots() {
    const { height, zones } = SLOTS;
    const slotWidth = BOARD_WIDTH / zones.length;
    const y = BOARD_HEIGHT - height / 2 - 50;

    this.slotBounds = [];
    let maxValue = -Infinity;
    let maxZoneIndex = -1;

    const topValue = Math.max(...zones.map((z) => z.value));
    this.hud.decorateSlots(y);

    zones.forEach(({ value, label }, i) => {
      const x = slotWidth * i + slotWidth / 2;
      // Booth fill warms toward gold with the tier so the prize slots read at a glance.
      const fill = lerpColor(CARNIVAL.nightDeep, CARNIVAL.panelRed, (value / topValue) * 0.85);
      const zone = this.add.rectangle(x, y, slotWidth - 2, height, fill).setStrokeStyle(1, CARNIVAL.wood);
      this.hud.slotLabel(x, y - 8, label ?? value, value === topValue);

      this.matter.add.gameObject(zone, {
        isStatic: true,
        isSensor: true,
        label: `slot-${value}`,
      });

      const left = slotWidth * i;
      this.slotBounds.push({ left, right: left + slotWidth });
      if (value > maxValue) {
        maxValue = value;
        maxZoneIndex = i;
      }
    });

    this.topZoneIndex = maxZoneIndex;
  }

  // Safety net: catches a ball that reaches the bottom without ever registering
  // a scoring-slot collision (e.g. a sensor near-miss), so a drop can't softlock the session.
  // Safety-net invisible sensor below the slots so a ball can never miss every collision.
  createFloor() {
    const floor = this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT + 5, BOARD_WIDTH, 10, 0x000000, 0);
    this.matter.add.gameObject(floor, { isStatic: true, isSensor: true, label: 'floor' });
  }

  // Contains the ball within the board so it can't drift off the side and miss every sensor below.
  // Invisible side walls to keep the ball within the board width.
  createWalls() {
    const wallThickness = 10;
    const left = this.add.rectangle(-wallThickness / 2, BOARD_HEIGHT / 2, wallThickness, BOARD_HEIGHT, 0x000000, 0);
    const right = this.add.rectangle(BOARD_WIDTH + wallThickness / 2, BOARD_HEIGHT / 2, wallThickness, BOARD_HEIGHT, 0x000000, 0);
    this.matter.add.gameObject(left, { isStatic: true, label: 'wall' });
    this.matter.add.gameObject(right, { isStatic: true, label: 'wall' });
  }

  // Create a Matter ball at the top of the board at the given x, disable input, reset stall detection.
  spawnBall(x) {
    this.narrator.clear();
    if (this.ballInPlay || this.ballsRemaining <= 0) return;

    this.ballInPlay = true;
    this.dropController.setEnabled(false);

    const ball = this.add.circle(x, 10, PHYSICS.ball.radius, PHYSICS.ball.color).setDepth(DEPTH.ball);
    this.matter.add.gameObject(ball, {
      restitution: PHYSICS.ball.restitution,
      friction: PHYSICS.ball.friction,
      frictionStatic: PHYSICS.ball.frictionStatic,
      shape: { type: 'circle', radius: PHYSICS.ball.radius },
      label: 'ball',
    });
    this.currentBall = ball;
    this.stallCheckElapsed = 0;
    this.stalledMs = 0;
    this.stallLastY = null;
    this.stallNudged = false;
  }

  // Belt-and-suspenders against a ball settling into a stable resting spot with no
  // peg/slot/floor collision left to fire (e.g. balanced on an isolated peg on a
  // sparse template) — samples downward progress periodically and force-recovers
  // rather than letting a drop (and the whole session) hang forever.
  // Frame-loop stall watchdog: samples ball Y progress and force-resolves if the ball gets stuck.
  update(time, delta) {
    if (!this.ballInPlay || !this.currentBall) return;

    this.stallCheckElapsed += delta;
    if (this.stallCheckElapsed < BALL_STALL.checkInterval) return;
    this.stallCheckElapsed = 0;

    const y = this.currentBall.y;
    const progressed = this.stallLastY === null || y - this.stallLastY > BALL_STALL.minProgress;
    this.stallLastY = y;

    if (progressed) {
      this.stalledMs = 0;
      this.stallNudged = false;
      return;
    }

    this.stalledMs += BALL_STALL.checkInterval;
    if (this.stalledMs >= BALL_STALL.forceResolveAfter) {
      this.resolveDrop(0, false);
    } else if (this.stalledMs >= BALL_STALL.nudgeAfter && !this.stallNudged) {
      this.stallNudged = true;
      const body = this.currentBall.body;
      const nudgeX = (Math.random() < 0.5 ? -1 : 1) * BALL_STALL.nudgeSpeed;
      this.matter.body.setVelocity(body, { x: nudgeX, y: body.velocity.y });
    }
  }

  // Collision dispatch: peg hits (score/carry/special popup/hazard fail), slot landings (resolve with bonus), floor safety net.
  handleCollisions(event) {
    for (const pair of event.pairs) {
      if (!this.ballInPlay) return; // already resolved this ball this frame (e.g. straddling two slots)

      const { bodyA, bodyB } = pair;
      const ballBody = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
      if (!ballBody || ballBody.gameObject !== this.currentBall) continue;

      const otherBody = ballBody === bodyA ? bodyB : bodyA;
      if (otherBody.label === 'peg') {
        const points = otherBody.gameObject.getData('points');
        if (points < 0) {
          this.failDrop(otherBody.gameObject.x, otherBody.gameObject.y, points);
          continue;
        }
        this.scoreManager.add(points);
        const carryBoost = otherBody.gameObject.getData('carryBoost');
        // Diminishing returns on repeat hits of the same peg this board — without this,
        // pegs (never destroyed) let one lucky bounce grind the carry cap out solo.
        let applied = 0;
        if (carryBoost > 0) {
          const hits = otherBody.gameObject.getData('hits');
          applied = this.carry.applyBoost(carryBoost, hits);
          otherBody.gameObject.setData('hits', hits + 1);
          if (applied > 0) this.updateCarryText();
        }
        const isSpecial = otherBody.gameObject.getData('isSpecial');
        if (isSpecial) {
          this.showSpecialPegPopup(otherBody.gameObject.x, otherBody.gameObject.y, points, applied);
        }
        if (isSpecial) this.audioFeedback.specialPegHit(otherBody.gameObject.getData('scoreMultiplier'));
        else this.audioFeedback.pegHit();
        this.cameras.main.shake(JUICE.shake.peg.duration, JUICE.shake.peg.intensity);
        this.flashPeg(otherBody.gameObject);
      } else if (otherBody.label?.startsWith('slot-')) {
        this.checkNearMiss(ballBody.gameObject.x);
        this.resolveDrop(Number(otherBody.label.split('-')[1]));
      } else if (otherBody.label === 'floor') {
        this.resolveDrop(0);
      }
    }
  }

  // Quick brightness pop on the peg itself so a hit reads as impact, not just camera shake.
  flashPeg(peg) {
    peg.setTint(JUICE.pegFlash.tint).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(JUICE.pegFlash.duration, () => peg.clearTint());
  }

  // Flags a "so close" moment when the ball lands one zone away from the top-value
  // zone but crossed close to that zone's boundary — not a precise trajectory check,
  // just a landing-x heuristic to keep the geometry simple.
  // "So close!" narrator callout when the ball lands just outside the top-value zone.
  checkNearMiss(landingX) {
    const topBounds = this.slotBounds[this.topZoneIndex];
    const nearLeftEdge = Math.abs(landingX - topBounds.left) <= JUICE.nearMissMargin;
    const nearRightEdge = Math.abs(landingX - topBounds.right) <= JUICE.nearMissMargin;
    if ((nearLeftEdge || nearRightEdge) && (landingX < topBounds.left || landingX > topBounds.right)) {
      this.narrator.show('So close!');
    }
  }

  // The celebratory popup for a scoring (mult-tier) peg hit. Intensity (0 = bronze,
  // 1 = diamond) scales font size, color heat, and travel distance, so the rare
  // top-tier pegs feel like a bigger deal than the common ones.
  // Animated reward-popup for mult-tier peg hits: intensity scales with carry-boost tier.
  showSpecialPegPopup(x, y, points, boost) {
    const { baseFontSize, maxFontSize, floatDistance, popInMs, holdMs, fadeMs, wobbleDegrees, colorLow, colorHigh } =
      JUICE.rewardPopup;
    const intensity = Phaser.Math.Clamp(boost / (CARRY.stepPerTier * 4), 0, 1);
    const fontSize = Math.round(Phaser.Math.Linear(baseFontSize, maxFontSize, intensity));
    const color = `#${lerpColor(colorLow, colorHigh, intensity).toString(16).padStart(6, '0')}`;

    // Two separate text objects (not one multi-line string) so the "BOOST" line stays a
    // fixed, readable size instead of blowing up along with the headline number.
    const valueText = this.add
      .text(0, 0, `+${points}`, {
        fontFamily: FONT_SIGN,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color,
        stroke: CARNIVAL.inkText,
        strokeThickness: Math.max(3, Math.round(fontSize * 0.15)),
      })
      .setOrigin(0.5, 1);

    const container = this.add.container(x, y - PHYSICS.peg.radius - 6, [valueText]).setDepth(DEPTH.effect);

    if (boost > 0) {
      const boostText = this.add
        .text(0, 3, `BOOST +${boost.toFixed(1)}x`, {
          fontFamily: FONT_HUD,
          fontSize: '13px',
          fontStyle: 'bold',
          color: CARNIVAL.goldText,
          stroke: CARNIVAL.inkText,
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0);
      container.add(boostText);
    }

    // Clamp so the widest (mult5-tier) popup can't run off the board edge for a peg
    // near the side margin.
    const halfWidth = container.getBounds().width / 2;
    container.x = Phaser.Math.Clamp(x, halfWidth + 4, BOARD_WIDTH - halfWidth - 4);
    container.setScale(0.3).setAlpha(0);

    const wobble = this.tweens.add({
      targets: container,
      angle: { from: -wobbleDegrees, to: wobbleDegrees },
      duration: (popInMs + holdMs) / 2,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.chain({
      targets: container,
      tweens: [
        { scale: 1.15, alpha: 1, duration: popInMs, ease: 'Back.easeOut' },
        { scale: 1, y: container.y - floatDistance * 0.35, duration: holdMs, ease: 'Sine.easeInOut' },
        { y: container.y - floatDistance, alpha: 0, scale: 0.9, duration: fadeMs, ease: 'Cubic.easeIn' },
      ],
      onComplete: () => {
        wobble.stop();
        container.destroy();
      },
    });
  }

  // Generate a small white circle texture used by the particle emitter for score bursts and fail explosions.
  createParticleTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particleDot', 8, 8);
    g.destroy();
  }

  // Particle burst tinted by current carry multiplier (cool→hot).
  spawnScoreBurst(x, y, multiplier) {
    const { baseCount, countPerMultiplier, baseColor, hotColor } = JUICE.particle;
    const count = Math.round(baseCount + countPerMultiplier * (multiplier - 1));
    const heat = (multiplier - 1) / (CARRY.max - 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(baseColor),
      Phaser.Display.Color.ValueToColor(hotColor),
      1,
      heat
    );
    this.scoreParticles.setParticleTint(color.color);
    this.scoreParticles.explode(count, x, y);
  }

  // Score a slot landing: payout runs through the carry multiplier sublinearly
  // (only payoutFraction of the boost applies), trigger juice feedback, evaluate
  // bonus balls against this board's earnings, finish the drop.
  resolveDrop(points) {
    const awarded = this.carry.payout(points);
    this.scoreManager.add(awarded);

    this.audioFeedback.ballDrop();

    if (points > 0) {
      this.spawnScoreBurst(this.currentBall.x, this.currentBall.y, this.carry.value);
      this.cameras.main.shake(JUICE.shake.score.duration, JUICE.shake.score.intensity * this.carry.value);
    }

    const bonusCount = this.bonusBalls.evaluateScoreThreshold(
      this.scoreManager.score - this.boardStartScore
    );
    if (bonusCount > 0) {
      this.awardBonusBalls(bonusCount, this.currentBall.x, this.currentBall.y);
    }

    this.finishBall();
  }

  // A negative (hazard) peg ends the drop immediately instead of letting the ball keep
  // falling into a slot — the penalty is the whole outcome, not just a -20 deduction, so
  // the feedback has to sell "the ball is gone," not just "you lost a few points."
  // Hazard peg collision: apply penalty, spawn fail juice (burst/shockwave/shake/flash/popup/narrator), finish the drop.
  failDrop(x, y, points) {
    this.scoreManager.add(points);
    this.showFailPopup(x, y);
    this.spawnFailBurst(x, y);
    this.spawnShockwave(x, y);
    this.cameras.main.shake(JUICE.pegFail.shake.duration, JUICE.pegFail.shake.intensity);
    this.cameras.main.flash(JUICE.pegFail.flash.duration, ...JUICE.pegFail.flash.color);
    this.audioFeedback.ballPop();
    this.audioFeedback.deadBallHit();
    this.narrator.show(Phaser.Utils.Array.GetRandom(FAIL_LINES));
    this.finishBall();
  }

  // Two-tone (red/black) burst well above the reward-peg particle counts — this is the
  // one moment in the game meant to read as "explosion," not "sparkle."
  // Two-tone red/black particle explosion for the hazard peg — deliberately over the top.
  spawnFailBurst(x, y) {
    const { count, colorCore, colorSpark } = JUICE.pegFail;
    this.scoreParticles.setParticleTint(colorCore);
    this.scoreParticles.explode(Math.round(count * 0.6), x, y);
    this.scoreParticles.setParticleTint(colorSpark);
    this.scoreParticles.explode(Math.round(count * 0.4), x, y);
  }

  // Expanding ring animation centred on the hazard peg impact point.
  spawnShockwave(x, y) {
    const { duration, startScale, endScale } = JUICE.pegFail.shockwave;
    const ring = this.add
      .circle(x, y, PHYSICS.peg.radius * 2, 0x000000, 0)
      .setStrokeStyle(3, JUICE.pegFail.colorCore, 0.9)
      .setDepth(DEPTH.effect)
      .setScale(startScale);

    this.tweens.add({
      targets: ring,
      scale: endScale,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // Shakes side-to-side rather than floating up — an impact tremor, not the celebratory
  // wobble used for reward pegs — so the two feel physically different, not just re-tinted.
  // Shaking "POPPED!/BUSTED!/GONE!" text that shakes in place rather than floating — impact tremor, not celebration.
  showFailPopup(x, y) {
    const { fontSize, floatDistance, popInMs, holdMs, fadeMs, shakeAmplitude, shakeCount, color } =
      JUICE.pegFail.popup;
    const label = Phaser.Utils.Array.GetRandom(['POPPED!', 'BUSTED!', 'GONE!']);

    const text = this.add
      .text(x, y - PHYSICS.peg.radius - 10, label, {
        fontFamily: FONT_SIGN,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color,
        stroke: CARNIVAL.inkText,
        strokeThickness: Math.max(4, Math.round(fontSize * 0.16)),
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.effect)
      .setScale(0.4)
      .setAlpha(0);

    const baseX = text.x;
    const shake = this.tweens.add({
      targets: text,
      x: { from: baseX - shakeAmplitude, to: baseX + shakeAmplitude },
      duration: 55,
      yoyo: true,
      repeat: shakeCount,
      ease: 'Sine.easeInOut',
    });

    this.tweens.chain({
      targets: text,
      tweens: [
        { scale: 1.2, alpha: 1, duration: popInMs, ease: 'Back.easeOut' },
        { scale: 1, duration: holdMs, ease: 'Sine.easeInOut' },
        { y: text.y - floatDistance, alpha: 0, duration: fadeMs, ease: 'Cubic.easeIn' },
      ],
      onComplete: () => {
        shake.stop();
        text.destroy();
      },
    });
  }

  // Clean up the current ball, decrement ball count, trigger narrator, and check for board-end.
  finishBall() {
    this.currentBall.destroy();
    this.currentBall = null;
    this.ballInPlay = false;

    this.ballsRemaining--;
    this.updateBallsText();
    this.updateBoardText();
    this.narrator.onDrop(this.scoreManager.score);

    // Target met ends the board immediately — leftover balls can't pad the total.
    if (this.ballsRemaining <= 0 || this.scoreManager.score - this.boardStartScore >= this.boardTarget) {
      this.endBoard();
    } else {
      this.dropController.setEnabled(true);
    }
  }

  // Reuses the existing juice-pass hooks (flash, particle burst) tinted green, plus a
  // narrator callout, rather than a separate feedback system.
  // Add extra balls to the session with green flash, particle burst, and narrator callout.
  awardBonusBalls(count, x, y) {
    this.ballsRemaining += count;
    this.cameras.main.flash(JUICE.bonusFlash.duration, ...JUICE.bonusFlash.color);
    this.scoreParticles.setParticleTint(Phaser.Display.Color.GetColor(...JUICE.bonusFlash.color));
    this.scoreParticles.explode(JUICE.bonusParticleCount * count, x, y);
  }

  // Sync the HUD ball count.
  updateBallsText() {
    this.hud.updateBalls(this.ballsRemaining);
  }

  // Sync the HUD board number and the points still needed to clear this board.
  updateBoardText() {
    this.hud.updateBoard(this.level, this.boardTarget - (this.scoreManager.score - this.boardStartScore));
  }

  // Sync the carry-multiplier display.
  updateCarryText() {
    this.carryText.setText(`BOOST ${this.carry.value.toFixed(1)}x`);
  }

  // Out of balls: advance to a new (randomly-shaped) board if this board's earnings
  // met its target, carrying the running total forward and the carry multiplier
  // forward at half its excess (carryOverFraction) so one hot board can't coast the
  // whole run. Otherwise the run ends here.
  // Session out of balls: check per-board earnings against target, advance or exit.
  endBoard() {
    this.dropController.setEnabled(false);
    const earned = this.scoreManager.score - this.boardStartScore;

    if (earned >= this.boardTarget) {
      this.scene.start('BoardClearedScene', {
        level: this.level,
        totalScore: this.scoreManager.score,
        carryMultiplier: this.carry.carryOver(),
      });
    } else {
      this.audioFeedback.gameOver();
      this.time.delayedCall(RESULTS.delayMs, () => {
        this.scene.start('ResultsScene', { score: this.scoreManager.score, level: this.level });
      });
    }
  }
}
