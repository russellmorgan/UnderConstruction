import Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT, PHYSICS, SLOTS, SESSION } from '../config/gameConfig.js';
import { createPegField } from '../systems/PegField.js';
import DropController from '../systems/DropController.js';
import ScoreManager from '../systems/ScoreManager.js';
import NarratorSystem from '../systems/NarratorSystem.js';

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
    this.narrator = new NarratorSystem(this, 10, 45, BOARD_WIDTH - 20);
    this.ballsText = this.add.text(BOARD_WIDTH - 140, BOARD_HEIGHT - 30, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    });
    this.updateBallsText();

    this.dropController = new DropController(this, (x) => this.spawnBall(x));

    this.matter.world.on('collisionstart', (event) => this.handleCollisions(event));

    this.endText = this.add
      .text(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, '', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  createSlots() {
    const { height, values } = SLOTS;
    const slotWidth = BOARD_WIDTH / values.length;
    const y = BOARD_HEIGHT - height / 2 - 50;

    values.forEach((value, i) => {
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
    });
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
      if (otherBody.label?.startsWith('slot-')) {
        this.resolveDrop(Number(otherBody.label.split('-')[1]));
      } else if (otherBody.label === 'floor') {
        this.resolveDrop(0);
      }
    }
  }

  resolveDrop(points) {
    this.scoreManager.add(points);
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
    this.endText
      .setText(`Session over\nFinal score: ${this.scoreManager.score}\n\nClick to play again`)
      .setVisible(true);
    this.input.once('pointerup', () => this.restart());
  }

  restart() {
    this.scene.restart();
  }
}
