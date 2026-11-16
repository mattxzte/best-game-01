// Prismweave — one level's live state. The player spends moves to place,
// turn and remove mirrors; after every action the beams are traced again
// and the prisms that glow decide whether the level is won. The level is
// failed the moment the moves run out with prisms still dark — a win on
// the very last move still counts as a win.

import { traceBeams } from './beams.js';

export class LevelState {
  constructor(level) {
    this.level = level;
    this.mirrors = new Map();
    this.movesUsed = 0;
    this.startedAt = null;
    this.elapsedMs = 0;
    this.won = false;
    this.failed = false;
    this.beams = traceBeams(level, this.mirrors);
    this.litBefore = new Set(this.beams.lit);
  }

  get movesLeft() {
    return this.level.par - this.movesUsed;
  }

  get prismsLit() {
    return this.beams.lit.size;
  }

  get prismTotal() {
    return this.level.prisms.length;
  }

  isOccupied(x, y) {
    const key = `${x},${y}`;
    if (this.level.walls.some(([wx, wy]) => wx === x && wy === y)) return true;
    if (this.level.emitters.some((e) => e.x === x && e.y === y)) return true;
    if (this.level.prisms.some((p) => p.x === x && p.y === y)) return true;
    if (this.level.splitters.some((s) => s.x === x && s.y === y)) return true;
    if (this.level.filters.some((f) => f.x === x && f.y === y)) return true;
    return this.mirrors.has(key);
  }

  // Returns 'placed' | 'rotated' | 'removed' | 'blocked' | 'done'.
  // 'done' means the level already ended and no move is spent.
  act(x, y, button) {
    if (this.won || this.failed) return 'done';
    const key = `${x},${y}`;
    if (button === 2) {
      if (!this.mirrors.has(key)) return 'blocked';
      this.mirrors.delete(key);
      return this.spend('removed');
    }
    if (this.mirrors.has(key)) {
      this.mirrors.set(key, this.mirrors.get(key) === '/' ? '\\' : '/');
      return this.spend('rotated');
    }
    if (this.isOccupied(x, y)) return 'blocked';
    this.mirrors.set(key, '/');
    return this.spend('placed');
  }

  spend(result) {
    this.movesUsed += 1;
    this.refresh();
    if (this.beams.lit.size === this.level.prisms.length) {
      this.won = true;
    } else if (this.movesLeft <= 0) {
      this.failed = true;
    }
    return result;
  }

  refresh() {
    this.beams = traceBeams(this.level, this.mirrors);
  }

  newlyLit() {
    const fresh = [...this.beams.lit].filter((i) => !this.litBefore.has(i));
    this.litBefore = new Set(this.beams.lit);
    return fresh;
  }

  score() {
    if (!this.won) return 0;
    return 1000 + 150 * this.movesLeft;
  }

  restart() {
    const fresh = new LevelState(this.level);
    fresh.startedAt = this.startedAt;
    return fresh;
  }
}
