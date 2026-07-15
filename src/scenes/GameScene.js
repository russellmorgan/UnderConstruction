import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, PHYSICS, SLOTS, SESSION, JUICE, COMBO } from '../config/gameConfig.js';
import { createPegField } from '../systems/PegField.js';
import DropController from '../systems/DropController.js';
import ScoreManager from '../systems/ScoreManager.js';
import ComboManager from '../systems/ComboManager.js';
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

    zones.forEach(({ value, comboQualifies }, i) => {
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
  }

  handleCollisions(event) {
    for (const pair of event.pairs) {
      if (!this.ballInPlay) return; // already resolved this ball this frame (e.g. straddling two slots)

      const { bodyA, bodyB } = pair;
      const ballBody = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
      if (!ballBody || ballBody.gameObject !== this.currentBall) continue;

      const otherBody = ballBody === bodyA ? bodyB : bodyA;
      if (otherBody.label === 'peg') {
        this.audioFeedback.pegHit();
        this.cameras.main.shake(JUICE.shake.peg.duration, JUICE.shake.peg.intensity);
      } else if (otherBody.label?.startsWith('slot-')) {
        this.checkNearMiss(ballBody.gameObject.x);
        this.resolveDrop(Number(otherBody.label.split('-')[1]), otherBody.gameObject.getData('comboQualifies'));
      } else if (otherBody.label === 'floor') {
        this.resolveDrop(0, false);
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

  resolveDrop(points, qualifies) {
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

  updateBallsText() {
    this.ballsText.setText(`Balls: ${this.ballsRemaining}`);
  }

  endSession() {
    this.dropController.setEnabled(false);
    this.scene.start('ResultsScene', { score: this.scoreManager.score });
  }
}
