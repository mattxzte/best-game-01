// Prismweave — the game itself: its screens, its loop, its score, and
// the sparkle bursts that fly when a prism wakes. One Game owns the
// current level, the campaign score, the best scores it remembers, and
// the mute state; the renderer draws it and input feeds it actions.

import { LEVELS, GRID_X, GRID_Y, CELL, COLORS } from './config.js';
import { LevelState } from './levels.js';
import { makeRng, rangeFrom } from './rng.js';
import { SoundBank } from './audio.js';

const BEST_KEY = 'prismweave-best-v1';

function loadBest() {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Array.from({ length: LEVELS.length }, (_, i) => Number(parsed[i]) || 0);
  } catch {
    return new Array(LEVELS.length).fill(0);
  }
}

function saveBest(scores) {
  try {
    const record = {};
    scores.forEach((score, i) => { record[i] = score; });
    window.localStorage.setItem(BEST_KEY, JSON.stringify(record));
  } catch {
    // Storage may be unavailable; the game plays on without it.
  }
}

export class Game {
  constructor() {
    this.screen = 'title';
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.levelState = new LevelState(this.level);
    this.scores = new Array(LEVELS.length).fill(0);
    this.bestScores = loadBest();
    this.particles = [];
    this.hoverCell = null;
    this.hoverPoint = { x: 0, y: 0 };
    this.sounds = new SoundBank();
    this.elapsedText = '0:00';
    this.levelStartedAt = 0;
    this.shotMode = false;
    this.fixedTime = 0;
    const deco = makeRng(20261116);
    this.stars = Array.from({ length: 130 }, () => ({
      x: deco() * 1280,
      y: deco() * 720,
      r: 0.6 + deco() * 1.5,
      phase: deco() * Math.PI * 2,
    }));
    this.nebulae = [
      { x: 220, y: 140, r: 320, color: 'rgba(76, 201, 255, 0.10)' },
      { x: 1080, y: 580, r: 360, color: 'rgba(255, 84, 112, 0.08)' },
      { x: 1050, y: 120, r: 280, color: 'rgba(61, 220, 151, 0.07)' },
    ];
  }

  get totalScore() {
    return this.scores.reduce((sum, s) => sum + s, 0);
  }

  startLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.levelState = new LevelState(this.level);
    this.levelState.startedAt = performance.now();
    this.levelStartedAt = performance.now();
    this.particles = [];
    this.screen = 'playing';
  }

  backToTitle() {
    this.screen = 'title';
    this.particles = [];
  }

  actOnCell(x, y, button) {
    if (this.screen !== 'playing') return;
    const result = this.levelState.act(x, y, button);
    if (result === 'placed') this.sounds.play('place');
    if (result === 'rotated') this.sounds.play('rotate');
    if (result === 'removed') this.sounds.play('remove');
    if (result === 'blocked') return;
    for (const prismIndex of this.levelState.newlyLit()) {
      const prism = this.level.prisms[prismIndex];
      this.burst(prism.x, prism.y, COLORS[prism.color]);
      this.sounds.prismLit();
    }
    if (this.levelState.won) this.finishLevel();
    else if (this.levelState.failed) {
      this.sounds.play('fail');
      this.screen = 'failed';
    }
  }

  finishLevel() {
    const gained = this.levelState.score();
    this.scores[this.levelIndex] = gained;
    if (gained > this.bestScores[this.levelIndex]) {
      this.bestScores[this.levelIndex] = gained;
      saveBest(this.bestScores);
    }
    this.sounds.play('win');
    this.screen = 'complete';
  }

  nextLevel() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.startLevel(this.levelIndex + 1);
    } else {
      this.screen = 'victory';
    }
  }

  restartLevel() {
    this.startLevel(this.levelIndex);
  }

  playAgain() {
    this.scores = new Array(LEVELS.length).fill(0);
    this.startLevel(0);
  }

  burst(cx, cy, color) {
    const px = GRID_X + cx * CELL + CELL / 2;
    const py = GRID_Y + cy * CELL + CELL / 2;
    const rng = makeRng((cx + 1) * 131 + (cy + 1) * 17 + this.levelState.movesUsed);
    for (let i = 0; i < 26; i++) {
      const angle = rng() * Math.PI * 2;
      const speed = 40 + rng() * 160;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.7 + rng() * 0.5,
        maxLife: 1.2,
        color,
        size: 2 + rng() * 3,
      });
    }
  }

  update(dtMs, nowMs) {
    const dt = Math.min(dtMs, 100) / 1000;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.screen === 'playing' && this.levelState.startedAt) {
      const elapsed = Math.floor((nowMs - this.levelState.startedAt) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = String(elapsed % 60).padStart(2, '0');
      this.elapsedText = `${minutes}:${seconds}`;
    }
  }

  onHover(x, y) {
    this.hoverPoint = { x, y };
  }

  onButton(id) {
    this.sounds.unlock();
    if (id === 'menu') {
      this.backToTitle();
      return;
    }
    if (id === 'restart' || id === 'retry') {
      this.sounds.play('click');
      this.restartLevel();
      return;
    }
    if (id === 'next') {
      this.sounds.play('click');
      this.nextLevel();
      return;
    }
    if (id === 'replay') {
      this.sounds.play('click');
      this.restartLevel();
      return;
    }
    if (id === 'again') {
      this.sounds.play('click');
      this.playAgain();
      return;
    }
    if (id.startsWith('level-')) {
      this.sounds.play('click');
      this.startLevel(Number(id.slice(6)));
    }
  }

  onKey(key) {
    this.sounds.unlock();
    if (key === 'm') {
      const muted = this.sounds.toggleMute();
      void muted;
      return;
    }
    if (key === 'escape') {
      if (this.screen !== 'title') this.backToTitle();
      return;
    }
    if (this.screen === 'title' && (key === 'enter' || key === ' ')) {
      this.startLevel(0);
      return;
    }
    if (key === 'r') {
      if (this.screen === 'playing' || this.screen === 'failed' || this.screen === 'complete') {
        this.restartLevel();
      }
      return;
    }
    if (key === 'n' && this.screen === 'complete') {
      this.nextLevel();
    }
  }

  onCanvasClick(x, y) {
    if (this.screen === 'title') {
      this.sounds.unlock();
      this.sounds.play('click');
      this.startLevel(0);
    }
  }

  now() {
    return this.shotMode ? this.fixedTime : performance.now();
  }
}
