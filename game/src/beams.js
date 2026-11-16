// Prismweave — beam tracing. A beam walks the grid cell by cell from an
// emitter until a wall or the edge stops it. Mirrors turn it ninety
// degrees, splitters divide it into a straight branch and a turned branch,
// filters repaint it, and prisms wake when a beam of their own colour
// passes through (a prism never blocks a beam). A visited set of
// cell + direction + colour keeps a loop of mirrors from tracing forever,
// and a segment cap keeps the trace bounded.

import { DIRECTIONS, GRID_COLS, GRID_ROWS } from './config.js';

export const MIRROR_TURN = {
  '/': { up: 'right', right: 'up', down: 'left', left: 'down' },
  '\\': { up: 'left', left: 'up', down: 'right', right: 'down' },
};

const RIGHT_TURN = { up: 'right', right: 'down', down: 'left', left: 'up' };

export function mirrorTurn(kind, dir) {
  return MIRROR_TURN[kind][dir];
}

const MAX_SEGMENTS = 600;

export function traceBeams(level, mirrors) {
  const walls = new Set(level.walls.map(([x, y]) => `${x},${y}`));
  const splitters = new Map(level.splitters.map((s) => [`${s.x},${s.y}`, s]));
  const filters = new Map(level.filters.map((f) => [`${f.x},${f.y}`, f]));
  const prisms = level.prisms.map((p, i) => ({ ...p, index: i, key: `${p.x},${p.y}` }));
  const prismByCell = new Map(prisms.map((p) => [p.key, p]));

  const segments = [];
  const lit = new Set();
  const visited = new Set();
  const queue = level.emitters.map((e) => ({ x: e.x, y: e.y, dir: e.dir, color: e.color }));

  while (queue.length > 0 && segments.length < MAX_SEGMENTS) {
    const beam = queue.shift();
    let { x, y, dir, color } = beam;
    for (;;) {
      const stepKey = `${x},${y},${dir},${color}`;
      if (visited.has(stepKey)) break;
      visited.add(stepKey);
      const step = DIRECTIONS[dir];
      const nx = x + step.dx;
      const ny = y + step.dy;
      if (nx < 0 || ny < 0 || nx >= GRID_COLS || ny >= GRID_ROWS) {
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, color });
        break;
      }
      segments.push({ x1: x, y1: y, x2: nx, y2: ny, color });
      const cellKey = `${nx},${ny}`;
      if (walls.has(cellKey)) break;
      const mirror = mirrors.get(cellKey);
      if (mirror) {
        dir = MIRROR_TURN[mirror][dir];
        x = nx;
        y = ny;
        continue;
      }
      if (splitters.has(cellKey)) {
        queue.push({ x: nx, y: ny, dir: RIGHT_TURN[dir], color });
        x = nx;
        y = ny;
        continue;
      }
      const filter = filters.get(cellKey);
      if (filter) {
        color = filter.color;
        x = nx;
        y = ny;
        continue;
      }
      const prism = prismByCell.get(cellKey);
      if (prism && prism.color === color) lit.add(prism.index);
      x = nx;
      y = ny;
      if (segments.length >= MAX_SEGMENTS) break;
    }
  }

  return { segments, lit };
}
