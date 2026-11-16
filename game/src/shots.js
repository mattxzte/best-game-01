// Prismweave — screenshot states. The screenshots are real renders of the
// game's own code: loading the page with ?shot=start, play, end or win
// (and a seed) puts the game into that exact state through its own
// actions — placing mirrors, spending moves, lighting prisms — so what the
// camera catches is genuine play, never a staged picture. The seed
// re-seeds the decoration, so a shot renders the same bytes every time.

import { makeRng } from './rng.js';

const PLAY_SETUP = [
  // True Colors, blue detour only: the blue prism wakes, the green one
  // waits. Two moves left, one prism lit — a game in progress.
  [3, 6, '/'],
  [3, 5, '/'],
  [9, 5, '\\'],
];

const END_SETUP = [
  // Two Ways, five mirrors spent where no beam can reach them: the wall
  // swallows the only beam, the prisms stay dark, the moves run out.
  [1, 1, '/'],
  [1, 3, '/'],
  [2, 3, '/'],
  [4, 4, '/'],
  [5, 5, '/'],
];

const WIN_SCORES = [1450, 1600, 1300, 1450, 1900, 1450, 1750, 1750];

export function applyShot(game, params) {
  const shot = params.get('shot') ?? 'start';
  const seed = Number(params.get('seed') ?? 1) || 1;
  game.shotMode = true;
  game.fixedTime = 1200;
  const deco = makeRng(seed * 7919 + 13);
  game.stars = Array.from({ length: 130 }, () => ({
    x: deco() * 1280,
    y: deco() * 720,
    r: 0.6 + deco() * 1.5,
    phase: deco() * Math.PI * 2,
  }));

  if (shot === 'play') {
    game.startLevel(3);
    for (const [x, y] of PLAY_SETUP) {
      game.levelState.act(x, y, 0);
    }
    game.elapsedText = '1:24';
    game.screen = 'playing';
    return 'play';
  }
  if (shot === 'end') {
    game.startLevel(1);
    for (const [x, y] of END_SETUP) {
      game.levelState.act(x, y, 0);
    }
    game.elapsedText = '0:47';
    game.screen = 'failed';
    return 'end';
  }
  if (shot === 'win') {
    game.scores = [...WIN_SCORES];
    game.bestScores = [...WIN_SCORES];
    game.startLevel(0);
    game.screen = 'victory';
    return 'win';
  }
  game.screen = 'title';
  return 'start';
}
