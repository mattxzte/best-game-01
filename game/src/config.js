// Prismweave — level data, palette and tuning.
// Every level is a small grid of walls, emitters, prisms, splitters and
// filters. The player bends beams with mirrors; a level is won when every
// prism glows in its own colour. Each level's par is the move budget the
// solution needs plus slack: placing, rotating or removing a mirror costs
// one move, and the level fails when the moves run out unlit.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const CELL = 64;
export const GRID_X = 256;
export const GRID_Y = 136;

export const COLORS = {
  red: '#ff5470',
  green: '#3ddc97',
  blue: '#4cc9ff',
  amber: '#ffb454',
  ink: '#0a0e1a',
  panel: '#121830',
  line: '#26305a',
  text: '#e8ecff',
  dim: '#8b93b8',
  mirror: '#aef3ff',
};

export const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const LEVELS = [
  {
    name: 'First Light',
    hint: 'Bend the beam around the wall. Click an empty cell to place a mirror; click a mirror to turn it.',
    par: 4,
    walls: [[4, 3]],
    emitters: [{ x: 0, y: 3, dir: 'right', color: 'red' }],
    prisms: [{ x: 8, y: 3, color: 'red' }],
    splitters: [],
    filters: [],
  },
  {
    name: 'Two Ways',
    hint: 'One beam can wake every prism it passes. Line them up in a single column.',
    par: 5,
    walls: [[3, 2]],
    emitters: [{ x: 0, y: 2, dir: 'right', color: 'green' }],
    prisms: [
      { x: 9, y: 1, color: 'green' },
      { x: 9, y: 6, color: 'green' },
    ],
    splitters: [],
    filters: [],
  },
  {
    name: 'Crossroads',
    hint: 'A splitter sends one beam straight on and one beam turning away. Use both branches.',
    par: 5,
    walls: [[7, 4]],
    emitters: [{ x: 0, y: 4, dir: 'right', color: 'blue' }],
    prisms: [
      { x: 9, y: 4, color: 'blue' },
      { x: 5, y: 7, color: 'blue' },
    ],
    splitters: [{ x: 5, y: 4 }],
    filters: [],
  },
  {
    name: 'True Colors',
    hint: 'A filter repaints any beam that crosses it. Red in, green out — match the prism.',
    par: 5,
    walls: [[5, 6]],
    emitters: [
      { x: 0, y: 3, dir: 'right', color: 'red' },
      { x: 0, y: 6, dir: 'right', color: 'blue' },
    ],
    prisms: [
      { x: 9, y: 3, color: 'green' },
      { x: 9, y: 6, color: 'blue' },
    ],
    splitters: [],
    filters: [{ x: 4, y: 3, color: 'green' }],
  },
  {
    name: 'Around the Wall',
    hint: 'The wall runs the whole height. One beam goes over the top, the other under the floor.',
    par: 8,
    walls: [
      [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
    ],
    emitters: [
      { x: 0, y: 1, dir: 'right', color: 'red' },
      { x: 0, y: 6, dir: 'right', color: 'green' },
    ],
    prisms: [
      { x: 10, y: 1, color: 'red' },
      { x: 10, y: 6, color: 'green' },
    ],
    splitters: [],
    filters: [],
  },
  {
    name: 'Split Decision',
    hint: 'Filter first, split second: the colour change happens before the beam divides.',
    par: 5,
    walls: [[8, 4]],
    emitters: [{ x: 0, y: 4, dir: 'right', color: 'red' }],
    prisms: [
      { x: 11, y: 4, color: 'green' },
      { x: 5, y: 7, color: 'green' },
    ],
    splitters: [{ x: 5, y: 4 }],
    filters: [{ x: 2, y: 4, color: 'green' }],
  },
  {
    name: 'The Gauntlet',
    hint: 'Two beams, three prisms, one shared grid. One beam can wake two prisms in a line.',
    par: 8,
    walls: [[5, 2], [5, 5]],
    emitters: [
      { x: 0, y: 2, dir: 'right', color: 'red' },
      { x: 0, y: 5, dir: 'right', color: 'blue' },
    ],
    prisms: [
      { x: 6, y: 2, color: 'red' },
      { x: 6, y: 7, color: 'red' },
      { x: 11, y: 5, color: 'blue' },
    ],
    splitters: [],
    filters: [],
  },
  {
    name: 'Grand Prism',
    hint: 'Everything at once: a split, a repaint, and two long detours. Spend every move like it matters.',
    par: 9,
    walls: [[8, 1], [5, 6]],
    emitters: [
      { x: 0, y: 1, dir: 'right', color: 'red' },
      { x: 0, y: 6, dir: 'right', color: 'green' },
    ],
    prisms: [
      { x: 11, y: 1, color: 'red' },
      { x: 4, y: 7, color: 'blue' },
      { x: 11, y: 6, color: 'green' },
    ],
    splitters: [{ x: 4, y: 1 }],
    filters: [{ x: 4, y: 4, color: 'blue' }],
  },
];

export const RULES_LINES = [
  'Click an empty cell to place a mirror. Click a mirror to turn it.',
  'Right-click a mirror to take it away. Every click costs one move.',
  'Light every prism in its own colour before the moves run out.',
  'Splitters divide a beam. Filters repaint it. Walls swallow it.',
];

export const GAME_TITLE = 'PRISMWEAVE';
export const GAME_TAGLINE = 'Bend the light. Wake the prisms.';
