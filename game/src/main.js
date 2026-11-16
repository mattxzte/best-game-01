// Prismweave — boot. Wires the canvas, the game, the renderer and the
// input together and runs the frame loop. In screenshot mode
// (?shot=...&seed=...) time is frozen and the loop only draws, so the
// captured frame is the same on every run.

import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { applyShot } from './shots.js';
import { VIEW_WIDTH, VIEW_HEIGHT } from './config.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;
const ctx = canvas.getContext('2d');

const game = new Game();
window.__prismweave = game;
const renderer = new Renderer();
const params = new URLSearchParams(window.location.search);

if (params.has('shot')) {
  applyShot(game, params);
}

const input = new Input(canvas, {
  onHover: (x, y) => {
    game.onHover(x, y);
    game.hoverCell = input.hoverCell;
  },
  onButton: (id) => game.onButton(id),
  onCell: (x, y, button) => {
    game.sounds.unlock();
    game.actOnCell(x, y, button);
  },
  onKey: (key) => game.onKey(key),
});

canvas.addEventListener('pointerdown', (event) => {
  const point = input.toGameCoords(event);
  if (game.screen === 'title' && !input.buttonAt(point.x, point.y)) {
    game.onCanvasClick(point.x, point.y);
  }
});

let last = performance.now();
function frame(now) {
  if (!game.shotMode) {
    game.update(now - last, now);
  }
  const buttons = renderer.draw(ctx, game, game.now());
  input.setButtons(buttons);
  last = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
