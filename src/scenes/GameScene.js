import Phaser from 'phaser';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PHYSICS,
  SLOTS,
  SESSION,
  JUICE,
  COMBO,
  BALL_STALL,
  PROGRESSION,
  CARRY,
  CARNIVAL,
} from '../config/gameConfig.js';
import GameHud, { DEPTH } from '../ui/GameHud.js';
import { FONT_HUD, FONT_SIGN, lerpColor } from '../ui/carnival.js';
import { createPegField } from '../systems/PegField.js';
import DropController from '../systems/DropController.js';
import ScoreManager from '../systems/ScoreManager.js';
import ComboManager from '../systems/ComboManager.js';
import BonusBallManager from '../systems/BonusBallManager.js';
import NarratorSystem from '../systems/NarratorSystem.js';
import AudioFeedback from '../systems/AudioFeedback.js';
import { FAIL_LINES } from '../data/narratorLines.js';

// Minimum score a player must EARN on a given board (not the running total) to
// advance to the next board. Grows geometrically so later boards demand more.
export function thresholdForLevel(level) {
  return Math.round(PROGRESSION.baseThreshold * PROGRESSION.thresholdGrowth ** (level - 1));
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // Carries progression across boards: a fresh board is just a scene restart with
  // this data, so board selection (already random per createPegField call) needs no
  // special handling here.
  init(data) {
    this.level = data?.level ?? 1;
    this.totalScore = data?.totalScore ?? 0;
    this.carryMultiplier = data?.carryMultiplier ?? CARRY.start;
  }

  create() {
    this.ballsRemaining = SESSION.ballsPerSession;
    this.ballInPlay = false;
    this.boardStartScore = this.totalScore;
    this.boardTarget = thresholdForLevel(this.level);

    this.cameras.main.filters.external.addGlow(
      JUICE.bloom.color,
      JUICE.bloom.outerStrength,
      0,
      1,
      false,
      JUICE.bloom.quality,
      JUICE.bloom.distance
    );

    createPegField(this);
    this.hud = new GameHud(this);
    this.createSlots();
    this.createFloor();
    this.createWalls();

    const railStyle = { fontFamily: FONT_HUD, fontSize: '19px', color: CARNIVAL.goldText, fontStyle: 'bold' };
    this.scoreManager = new ScoreManager(this, 74, BOARD_HEIGHT - 38, this.totalScore, {
      style: railStyle,
      label: null,
    });
    this.scoreManager.text.setDepth(DEPTH.label);

    this.comboManager = new ComboManager(this, BOARD_WIDTH - 12, BOARD_HEIGHT - 46, {
      fontFamily: FONT_HUD,
      fontSize: '13px',
      color: CARNIVAL.cream,
    });
    this.comboManager.text.setOrigin(1, 0).setDepth(DEPTH.label);

    this.bonusBalls = new BonusBallManager(this.totalScore);

    this.narrator = new NarratorSystem(this, 0, 0, 292, {
      style: { fontFamily: FONT_HUD, fontSize: '12px', color: CARNIVAL.cream, align: 'center' },
      onChange: (line) => this.hud.setBarkerVisible(Boolean(line)),
    });
    this.narrator.text.setOrigin(0.5);
    this.hud.attachBarkerText(this.narrator.text);

    this.audioFeedback = new AudioFeedback();
    this.updateBallsText();
    this.updateBoardText();

    this.carryText = this.add
      .text(BOARD_WIDTH - 12, BOARD_HEIGHT - 28, '', {
        fontFamily: FONT_HUD,
        fontSize: '13px',
        color: CARNIVAL.goldText,
      })
      .setOrigin(1, 0)
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

    this.matter.world.on('collisionstart', (event) => this.handleCollisions(event));

    this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
  }

  pauseGame() {
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  createSlots() {
    const { height, zones } = SLOTS;
    const slotWidth = BOARD_WIDTH / zones.length;
    const y = BOARD_HEIGHT - height / 2 - 50;

    this.slotBounds = [];
    let maxValue = -Infinity;
    let maxZoneIndex = -1;

    const topValue = Math.max(...zones.map((z) => z.value));
    this.hud.decorateSlots(y);

    zones.forEach(({ value, comboQualifies, grantsBonusBall }, i) => {
      const x = slotWidth * i + slotWidth / 2;
      // Booth fill warms toward gold with the tier so the prize slots read at a glance.
      const fill = lerpColor(CARNIVAL.nightDeep, CARNIVAL.panelRed, (value / topValue) * 0.85);
      const zone = this.add.rectangle(x, y, slotWidth - 2, height, fill).setStrokeStyle(1, CARNIVAL.wood);
      this.hud.slotLabel(x, y - 8, value, value === topValue);

      this.matter.add.gameObject(zone, {
        isStatic: true,
        isSensor: true,
        label: `slot-${value}`,
      });
      zone.setData('comboQualifies', comboQualifies);
      zone.setData('grantsBonusBall', grantsBonusBall);

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
  createFloor() {
    const floor = this.add.rectangle(BOARD_WIDTH / 2, BOARD_HEIGHT + 5, BOARD_WIDTH, 10, 0x000000, 0);
    this.matter.add.gameObject(floor, { isStatic: true, isSensor: true, label: 'floor' });
  }

  // Contains the ball within the board so it can't drift off the side and miss every sensor below.
  createWalls() {
    const wallThickness = 10;
    const left = this.add.rectangle(-wallThickness / 2, BOARD_HEIGHT / 2, wallThickness, BOARD_HEIGHT, 0x000000, 0);
    const right = this.add.rectangle(BOARD_WIDTH + wallThickness / 2, BOARD_HEIGHT / 2, wallThickness, BOARD_HEIGHT, 0x000000, 0);
    this.matter.add.gameObject(left, { isStatic: true, label: 'wall' });
    this.matter.add.gameObject(right, { isStatic: true, label: 'wall' });
  }

  spawnBall(x) {
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
      this.resolveDrop(0, false, false);
    } else if (this.stalledMs >= BALL_STALL.nudgeAfter && !this.stallNudged) {
      this.stallNudged = true;
      const body = this.currentBall.body;
      const nudgeX = (Math.random() < 0.5 ? -1 : 1) * BALL_STALL.nudgeSpeed;
      this.matter.body.setVelocity(body, { x: nudgeX, y: body.velocity.y });
    }
  }

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
        if (carryBoost > 0) {
          this.carryMultiplier = Math.min(CARRY.max, this.carryMultiplier + carryBoost);
          this.updateCarryText();
        }
        if (otherBody.gameObject.getData('isSpecial')) {
          this.showSpecialPegPopup(otherBody.gameObject.x, otherBody.gameObject.y, points, carryBoost);
        }
        this.audioFeedback.pegHit();
        this.cameras.main.shake(JUICE.shake.peg.duration, JUICE.shake.peg.intensity);
      } else if (otherBody.label?.startsWith('slot-')) {
        this.checkNearMiss(ballBody.gameObject.x);
        this.resolveDrop(
          Number(otherBody.label.split('-')[1]),
          otherBody.gameObject.getData('comboQualifies'),
          otherBody.gameObject.getData('grantsBonusBall')
        );
      } else if (otherBody.label === 'floor') {
        this.resolveDrop(0, false, false);
      }
    }
  }

  // Flags a "so close" moment when the ball lands one zone away from the top-value
  // zone but crossed close to that zone's boundary — not a precise trajectory check,
  // just a landing-x heuristic to keep the geometry simple.
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

  createParticleTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particleDot', 8, 8);
    g.destroy();
  }

  spawnScoreBurst(x, y, multiplier) {
    const { baseCount, countPerMultiplier, baseColor, hotColor } = JUICE.particle;
    const count = Math.round(baseCount + countPerMultiplier * (multiplier - 1));
    const heat = (multiplier - 1) / (COMBO.max - 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(baseColor),
      Phaser.Display.Color.ValueToColor(hotColor),
      1,
      heat
    );
    this.scoreParticles.setParticleTint(color.color);
    this.scoreParticles.explode(count, x, y);
  }

  resolveDrop(points, qualifies, grantsBonusBall) {
    const { appliedMultiplier, broke } = this.comboManager.registerLanding(qualifies);
    const awarded = Math.round(points * appliedMultiplier * this.carryMultiplier);
    this.scoreManager.add(awarded);

    if (points > 0) {
      this.spawnScoreBurst(this.currentBall.x, this.currentBall.y, appliedMultiplier);
      this.cameras.main.shake(JUICE.shake.score.duration, JUICE.shake.score.intensity * appliedMultiplier);
      this.audioFeedback.scoreHit(Math.round((appliedMultiplier - 1) / COMBO.step));
    }
    if (broke) {
      this.cameras.main.flash(JUICE.comboBreakFlash.duration, ...JUICE.comboBreakFlash.color);
      this.audioFeedback.comboBreak();
    }

    const bonusCount =
      this.bonusBalls.evaluateZone(grantsBonusBall) +
      this.bonusBalls.evaluateScoreThreshold(this.scoreManager.score) +
      this.bonusBalls.evaluateComboMilestone(this.comboManager.multiplier);
    if (bonusCount > 0) {
      this.awardBonusBalls(bonusCount, this.currentBall.x, this.currentBall.y);
    }

    this.finishBall();
  }

  // A negative (hazard) peg ends the drop immediately instead of letting the ball keep
  // falling into a slot — the penalty is the whole outcome, not just a -20 deduction, so
  // the feedback has to sell "the ball is gone," not just "you lost a few points."
  failDrop(x, y, points) {
    this.scoreManager.add(points);
    this.showFailPopup(x, y);
    this.spawnFailBurst(x, y);
    this.spawnShockwave(x, y);
    this.cameras.main.shake(JUICE.pegFail.shake.duration, JUICE.pegFail.shake.intensity);
    this.cameras.main.flash(JUICE.pegFail.flash.duration, ...JUICE.pegFail.flash.color);
    this.audioFeedback.ballPop();
    this.sound.play('hit_hurt');
    this.narrator.show(Phaser.Utils.Array.GetRandom(FAIL_LINES));
    this.finishBall();
  }

  // Two-tone (red/black) burst well above the reward-peg particle counts — this is the
  // one moment in the game meant to read as "explosion," not "sparkle."
  spawnFailBurst(x, y) {
    const { count, colorCore, colorSpark } = JUICE.pegFail;
    this.scoreParticles.setParticleTint(colorCore);
    this.scoreParticles.explode(Math.round(count * 0.6), x, y);
    this.scoreParticles.setParticleTint(colorSpark);
    this.scoreParticles.explode(Math.round(count * 0.4), x, y);
  }

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

  finishBall() {
    this.currentBall.destroy();
    this.currentBall = null;
    this.ballInPlay = false;

    this.ballsRemaining--;
    this.updateBallsText();
    this.narrator.onDrop(this.scoreManager.score);

    if (this.ballsRemaining <= 0) {
      this.endBoard();
    } else {
      this.dropController.setEnabled(true);
    }
  }

  // Reuses the existing juice-pass hooks (flash, particle burst) tinted green, plus a
  // narrator callout and the real "Powerup 5" cue, rather than a separate feedback system.
  awardBonusBalls(count, x, y) {
    this.ballsRemaining += count;
    this.cameras.main.flash(JUICE.bonusFlash.duration, ...JUICE.bonusFlash.color);
    this.scoreParticles.setParticleTint(Phaser.Display.Color.GetColor(...JUICE.bonusFlash.color));
    this.scoreParticles.explode(JUICE.bonusParticleCount * count, x, y);
    this.sound.play('powerup_5');
    this.narrator.show('Free ball!');
  }

  updateBallsText() {
    this.hud.updateBalls(this.ballsRemaining);
  }

  updateBoardText() {
    this.hud.updateBoard(this.level, this.boardTarget);
  }

  updateCarryText() {
    this.carryText.setText(`BOOST ${this.carryMultiplier.toFixed(1)}x`);
  }

  // Out of balls: advance to a new (randomly-shaped) board if this board's earnings
  // met its target, carrying the running total and carry multiplier forward. Otherwise
  // the run ends here.
  endBoard() {
    this.dropController.setEnabled(false);
    const earned = this.scoreManager.score - this.boardStartScore;

    if (earned >= this.boardTarget) {
      this.scene.start('BoardClearedScene', {
        level: this.level,
        totalScore: this.scoreManager.score,
        carryMultiplier: this.carryMultiplier,
      });
    } else {
      this.scene.start('ResultsScene', { score: this.scoreManager.score, level: this.level });
    }
  }
}
