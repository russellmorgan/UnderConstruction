import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, PHYSICS, SLOTS, SESSION, JUICE, COMBO, BALL_STALL } from '../config/gameConfig.js';
import { createPegField } from '../systems/PegField.js';
import DropController from '../systems/DropController.js';
import ScoreManager from '../systems/ScoreManager.js';
import ComboManager from '../systems/ComboManager.js';
import BonusBallManager from '../systems/BonusBallManager.js';
import NarratorSystem from '../systems/NarratorSystem.js';
import AudioFeedback from '../systems/AudioFeedback.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.ballsRemaining = SESSION.ballsPerSession;
    this.ballInPlay = false;

    createPegField(this);
    this.createSlots();
    this.createFloor();
    this.createWalls();

    this.scoreManager = new ScoreManager(this, 10, BOARD_HEIGHT - 30);
    this.comboManager = new ComboManager(this, 10, BOARD_HEIGHT - 55);
    this.bonusBalls = new BonusBallManager();
    this.narrator = new NarratorSystem(this, 10, 45, BOARD_WIDTH - 20);
    this.audioFeedback = new AudioFeedback();
    this.ballsText = this.add.text(BOARD_WIDTH - 140, BOARD_HEIGHT - 30, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    });
    this.updateBallsText();

    this.createParticleTexture();
    this.scoreParticles = this.add.particles(0, 0, 'particleDot', {
      lifespan: 400,
      speed: { min: 60, max: 180 },
      scale: { start: 1, end: 0 },
      emitting: false,
    });

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

    zones.forEach(({ value, comboQualifies, grantsBonusBall }, i) => {
      const x = slotWidth * i + slotWidth / 2;
      const zone = this.add.rectangle(x, y, slotWidth - 2, height, 0x2a2a4a).setStrokeStyle(1, 0x555577);
      this.add
        .text(x, y, String(value), { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' })
        .setOrigin(0.5);

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

    const ball = this.add.circle(x, 10, PHYSICS.ball.radius, 0xff5d8f);
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
        if (otherBody.gameObject.getData('isSpecial')) {
          this.showPegPopup(otherBody.gameObject.x, otherBody.gameObject.y, points);
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

  showPegPopup(x, y, points, label) {
    const { riseDistance, duration, positiveColor, negativeColor } = JUICE.pegPopup;
    const text = this.add
      .text(x, y - PHYSICS.peg.radius - 4, label ?? `${points > 0 ? '+' : ''}${points}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: points > 0 ? positiveColor : negativeColor,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - riseDistance,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
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
    const awarded = Math.round(points * appliedMultiplier);
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

  // A negative peg ends the drop immediately instead of letting the ball keep falling
  // into a slot — the penalty is the whole outcome, not just a deduction along the way.
  failDrop(x, y, points) {
    this.scoreManager.add(points);
    this.showPegPopup(x, y, points, 'FAIL');
    this.scoreParticles.setParticleTint(JUICE.pegFail.color);
    this.scoreParticles.explode(JUICE.pegFail.count, x, y);
    this.sound.play('hit_hurt');
    this.finishBall();
  }

  finishBall() {
    this.currentBall.destroy();
    this.currentBall = null;
    this.ballInPlay = false;

    this.ballsRemaining--;
    this.updateBallsText();
    this.narrator.onDrop(this.scoreManager.score);

    if (this.ballsRemaining <= 0) {
      this.endSession();
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
    this.ballsText.setText(`Balls: ${this.ballsRemaining}`);
  }

  endSession() {
    this.dropController.setEnabled(false);
    this.scene.start('ResultsScene', { score: this.scoreManager.score });
  }
}
