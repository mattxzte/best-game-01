// Prismweave — keyboard and mouse input. The canvas scales to fit the
// browser window, so pointer positions are mapped back into the game's
// own 1280x720 coordinates before anything reads them. Buttons are plain
// rectangles the renderer draws; this module keeps their bounds and reports
// which one a click landed on.

import { VIEW_WIDTH, VIEW_HEIGHT, GRID_X, GRID_Y, CELL, GRID_COLS, GRID_ROWS } from './config.js';

export class Input {
  constructor(canvas, hooks) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.hoverCell = null;
    this.buttons = [];
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    canvas.addEventListener('pointermove', (event) => {
      const point = this.toGameCoords(event);
      this.hoverCell = this.cellAt(point.x, point.y);
      hooks.onHover(point.x, point.y);
    });
    canvas.addEventListener('pointerleave', () => {
      this.hoverCell = null;
    });
    canvas.addEventListener('pointerdown', (event) => {
      const point = this.toGameCoords(event);
      const button = this.buttonAt(point.x, point.y);
      if (button) {
        hooks.onButton(button.id);
        return;
      }
      const cell = this.cellAt(point.x, point.y);
      if (cell) hooks.onCell(cell.x, cell.y, event.button);
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      hooks.onKey(event.key.toLowerCase());
    });
    window.addEventListener('resize', () => this.fit());
    this.fit();
  }

  fit() {
    const scale = Math.min(
      window.innerWidth / VIEW_WIDTH,
      window.innerHeight / VIEW_HEIGHT,
    );
    this.scale = scale;
    this.offsetX = (window.innerWidth - VIEW_WIDTH * scale) / 2;
    this.offsetY = (window.innerHeight - VIEW_HEIGHT * scale) / 2;
    this.canvas.style.width = `${VIEW_WIDTH * scale}px`;
    this.canvas.style.height = `${VIEW_HEIGHT * scale}px`;
  }

  toGameCoords(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width * VIEW_WIDTH,
      y: (event.clientY - rect.top) / rect.height * VIEW_HEIGHT,
    };
  }

  cellAt(x, y) {
    const cx = Math.floor((x - GRID_X) / CELL);
    const cy = Math.floor((y - GRID_Y) / CELL);
    if (cx < 0 || cy < 0 || cx >= GRID_COLS || cy >= GRID_ROWS) return null;
    return { x: cx, y: cy };
  }

  buttonAt(x, y) {
    return this.buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) ?? null;
  }

  setButtons(buttons) {
    this.buttons = buttons;
  }
}
