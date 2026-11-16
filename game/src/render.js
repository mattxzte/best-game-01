// Prismweave — everything the player sees, drawn on one canvas: the
// starfield and nebula behind the board, the grid and its pieces, the
// glowing beams with their flowing dash, the sparkle bursts, the HUD, and
// every screen (title, level complete, level failed, victory). Drawing
// never changes game state; the buttons it draws are returned so input
// can tell which one a click landed on.

import { COLORS, VIEW_WIDTH, VIEW_HEIGHT, GRID_X, GRID_Y, CELL, GRID_COLS, GRID_ROWS, RULES_LINES, GAME_TITLE, GAME_TAGLINE } from './config.js';

function cellCenter(x, y) {
  return { x: GRID_X + x * CELL + CELL / 2, y: GRID_Y + y * CELL + CELL / 2 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDiamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
}

function drawButton(ctx, b, hovered) {
  ctx.save();
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fillStyle = hovered ? '#232c52' : '#171d3a';
  ctx.fill();
  ctx.strokeStyle = hovered ? COLORS.mirror : COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.restore();
}

export class Renderer {
  draw(ctx, game, timeMs) {
    this.drawBackdrop(ctx, game, timeMs);
    if (game.screen === 'title') {
      this.drawTitle(ctx, game, timeMs);
      return [];
    }
    if (game.screen === 'playing' || game.screen === 'complete' || game.screen === 'failed') {
      const buttons = this.drawPlayfield(ctx, game, timeMs);
      if (game.screen === 'complete') return buttons.concat(this.drawComplete(ctx, game));
      if (game.screen === 'failed') return buttons.concat(this.drawFailed(ctx, game));
      return buttons;
    }
    if (game.screen === 'victory') {
      this.drawPlayfield(ctx, game, timeMs);
      return this.drawVictory(ctx, game);
    }
    return [];
  }

  drawBackdrop(ctx, game, timeMs) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, '#0a0e1a');
    gradient.addColorStop(0.6, '#0d1230');
    gradient.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    for (const blob of game.nebulae) {
      const radial = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
      radial.addColorStop(0, blob.color);
      radial.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(blob.x - blob.r, blob.y - blob.r, blob.r * 2, blob.r * 2);
    }
    ctx.save();
    for (const star of game.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(timeMs / 900 + star.phase);
      ctx.globalAlpha = 0.25 + 0.55 * twinkle;
      ctx.fillStyle = '#dfe6ff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPlayfield(ctx, game, timeMs) {
    const level = game.level;
    const state = game.levelState;
    ctx.save();
    ctx.strokeStyle = 'rgba(38, 48, 90, 0.55)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(GRID_X + x * CELL, GRID_Y);
      ctx.lineTo(GRID_X + x * CELL, GRID_Y + GRID_ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(GRID_X, GRID_Y + y * CELL);
      ctx.lineTo(GRID_X + GRID_COLS * CELL, GRID_Y + y * CELL);
      ctx.stroke();
    }
    const hover = game.hoverCell;
    if (hover && game.screen === 'playing' && !state.won && !state.failed) {
      ctx.fillStyle = 'rgba(174, 243, 255, 0.10)';
      ctx.fillRect(GRID_X + hover.x * CELL + 1, GRID_Y + hover.y * CELL + 1, CELL - 2, CELL - 2);
    }
    for (const [wx, wy] of level.walls) {
      const px = GRID_X + wx * CELL;
      const py = GRID_Y + wy * CELL;
      ctx.fillStyle = '#1a2142';
      roundRect(ctx, px + 3, py + 3, CELL - 6, CELL - 6, 8);
      ctx.fill();
      ctx.strokeStyle = '#2c3766';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    this.drawBeams(ctx, state.beams.segments, timeMs);
    for (const emitter of level.emitters) this.drawEmitter(ctx, emitter);
    for (const splitter of level.splitters) this.drawSplitter(ctx, splitter);
    for (const filter of level.filters) this.drawFilter(ctx, filter);
    for (const prism of level.prisms) {
      const lit = state.beams.lit.has(level.prisms.indexOf(prism));
      this.drawPrism(ctx, prism, lit, timeMs);
    }
    for (const [key, kind] of state.mirrors) {
      const [mx, my] = key.split(',').map(Number);
      this.drawMirror(ctx, mx, my, kind);
    }
    this.drawParticles(ctx, game.particles);
    ctx.restore();
    return this.drawHud(ctx, game);
  }

  drawBeams(ctx, segments, timeMs) {
    ctx.save();
    ctx.lineCap = 'round';
    for (const seg of segments) {
      const a = cellCenter(seg.x1, seg.y1);
      const b = cellCenter(seg.x2, seg.y2);
      const color = COLORS[seg.color];
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 9;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 0;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -timeMs / 28;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawEmitter(ctx, emitter) {
    const c = cellCenter(emitter.x, emitter.y);
    const color = COLORS[emitter.color];
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    const arrow = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[emitter.dir];
    ctx.moveTo(c.x + arrow[0] * 8, c.y + arrow[1] * 8);
    ctx.lineTo(c.x - arrow[1] * 5 - arrow[0] * 4, c.y - arrow[0] * 5 - arrow[1] * 4);
    ctx.lineTo(c.x + arrow[1] * 5 - arrow[0] * 4, c.y + arrow[0] * 5 - arrow[1] * 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawSplitter(ctx, splitter) {
    const c = cellCenter(splitter.x, splitter.y);
    ctx.save();
    ctx.shadowColor = COLORS.amber;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.amber;
    drawDiamond(ctx, c.x, c.y, 15);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFilter(ctx, filter) {
    const c = cellCenter(filter.x, filter.y);
    const color = COLORS[filter.color];
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPrism(ctx, prism, lit, timeMs) {
    const c = cellCenter(prism.x, prism.y);
    const color = COLORS[prism.color];
    ctx.save();
    if (lit) {
      const pulse = 0.75 + 0.25 * Math.sin(timeMs / 300);
      ctx.shadowColor = color;
      ctx.shadowBlur = 22 * pulse;
      ctx.fillStyle = color;
      drawDiamond(ctx, c.x, c.y, 19);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      drawDiamond(ctx, c.x, c.y, 8);
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      drawDiamond(ctx, c.x, c.y, 17);
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = color;
      drawDiamond(ctx, c.x, c.y, 17);
      ctx.fill();
    }
    ctx.restore();
  }

  drawMirror(ctx, x, y, kind) {
    const c = cellCenter(x, y);
    ctx.save();
    ctx.strokeStyle = COLORS.mirror;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#7dd8ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    if (kind === '/') {
      ctx.moveTo(c.x + 16, c.y + 16);
      ctx.lineTo(c.x - 16, c.y - 16);
    } else {
      ctx.moveTo(c.x - 16, c.y + 16);
      ctx.lineTo(c.x + 16, c.y - 16);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (kind === '/') {
      ctx.moveTo(c.x + 13, c.y + 13);
      ctx.lineTo(c.x - 13, c.y - 13);
    } else {
      ctx.moveTo(c.x - 13, c.y + 13);
      ctx.lineTo(c.x + 13, c.y - 13);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawParticles(ctx, particles) {
    ctx.save();
    for (const p of particles) {
      const fade = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * fade + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHud(ctx, game) {
    const state = game.levelState;
    const level = game.level;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 24, 48, 0.85)';
    roundRect(ctx, 24, 16, VIEW_WIDTH - 48, 52, 12);
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Level ${game.levelIndex + 1} · ${level.name}`, 44, 43);
    const prismX = 400;
    for (let i = 0; i < level.prisms.length; i++) {
      const prism = level.prisms[i];
      const lit = state.beams.lit.has(i);
      ctx.fillStyle = lit ? COLORS[prism.color] : '#39406b';
      ctx.shadowColor = lit ? COLORS[prism.color] : 'transparent';
      ctx.shadowBlur = lit ? 10 : 0;
      drawDiamond(ctx, prismX + i * 30, 42, 9);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = state.movesLeft <= 2 ? '#ff5470' : COLORS.text;
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText(`Moves ${state.movesLeft}/${level.par}`, 560, 43);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Score ${game.totalScore}`, 760, 43);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText(game.elapsedText, 920, 43);
    const buttons = [
      { id: 'restart', label: 'Restart (R)', x: 1020, y: 26, w: 108, h: 32 },
      { id: 'menu', label: 'Menu', x: 1136, y: 26, w: 60, h: 32 },
    ];
    for (const b of buttons) drawButton(ctx, b, false);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(level.hint, VIEW_WIDTH / 2, 688);
    ctx.fillText('Click empty cell: place mirror · Click mirror: turn it · Right-click: remove · M: sound', VIEW_WIDTH / 2, 710);
    ctx.restore();
    return buttons;
  }

  drawPanel(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 11, 24, 0.72)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#121830';
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  drawTitle(ctx, game, timeMs) {
    ctx.save();
    ctx.textAlign = 'center';
    const bob = Math.sin(timeMs / 700) * 4;
    ctx.fillStyle = COLORS.text;
    ctx.font = '800 84px system-ui, sans-serif';
    ctx.shadowColor = '#4cc9ff';
    ctx.shadowBlur = 30;
    ctx.fillText(GAME_TITLE, VIEW_WIDTH / 2, 190 + bob);
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.amber;
    ctx.font = '600 26px system-ui, sans-serif';
    ctx.fillText(GAME_TAGLINE, VIEW_WIDTH / 2, 238);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 18px system-ui, sans-serif';
    for (let i = 0; i < RULES_LINES.length; i++) {
      ctx.fillText(RULES_LINES[i], VIEW_WIDTH / 2, 292 + i * 28);
    }
    const pulse = 0.6 + 0.4 * Math.sin(timeMs / 400);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.mirror;
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText('Click anywhere to play', VIEW_WIDTH / 2, 436);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.dim;
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('or pick a level', VIEW_WIDTH / 2, 486);
    const buttons = [];
    for (let i = 0; i < 8; i++) {
      const bx = VIEW_WIDTH / 2 - 4 * 86 + i * 86;
      const done = game.bestScores[i] > 0;
      const b = { id: `level-${i}`, label: done ? `${i + 1} ★` : `${i + 1}`, x: bx, y: 510, w: 74, h: 52 };
      drawButton(ctx, b, false);
      buttons.push(b);
    }
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.fillText('8 levels · every click costs a move · no downloads, no network', VIEW_WIDTH / 2, 610);
    ctx.restore();
    return buttons;
  }

  drawComplete(ctx, game) {
    this.drawPanel(ctx, 390, 190, 500, 330);
    const state = game.levelState;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.green;
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.shadowColor = COLORS.green;
    ctx.shadowBlur = 20;
    ctx.fillText('Prisms Lit!', VIEW_WIDTH / 2, 258);
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(`${game.level.name} complete`, VIEW_WIDTH / 2, 308);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 19px system-ui, sans-serif';
    ctx.fillText(`Base 1000  +  ${state.movesLeft} moves left × 150`, VIEW_WIDTH / 2, 348);
    ctx.fillStyle = COLORS.amber;
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillText(`+${state.score()} points`, VIEW_WIDTH / 2, 392);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 17px system-ui, sans-serif';
    ctx.fillText(`Total score ${game.totalScore}`, VIEW_WIDTH / 2, 428);
    const visible = [
      { id: 'next', label: 'Next Level (N)', x: 455, y: 458, w: 170, h: 44 },
      { id: 'replay', label: 'Replay (R)', x: 645, y: 458, w: 120, h: 44 },
      { id: 'menu', label: 'Menu', x: 785, y: 458, w: 90, h: 44 },
    ];
    for (const b of visible) drawButton(ctx, b, false);
    ctx.restore();
    return visible;
  }

  drawFailed(ctx, game) {
    this.drawPanel(ctx, 390, 210, 500, 300);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5470';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.shadowColor = '#ff5470';
    ctx.shadowBlur = 20;
    ctx.fillText('Out of Moves', VIEW_WIDTH / 2, 278);
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(`${game.level.name} stays dark — for now`, VIEW_WIDTH / 2, 328);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 19px system-ui, sans-serif';
    ctx.fillText(`${game.levelState.prismsLit} of ${game.levelState.prismTotal} prisms lit`, VIEW_WIDTH / 2, 368);
    const buttons = [
      { id: 'retry', label: 'Try Again (R)', x: 490, y: 418, w: 150, h: 44 },
      { id: 'menu', label: 'Menu', x: 660, y: 418, w: 100, h: 44 },
    ];
    for (const b of buttons) drawButton(ctx, b, false);
    ctx.restore();
    return buttons;
  }

  drawVictory(ctx, game) {
    this.drawPanel(ctx, 340, 170, 600, 380);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.amber;
    ctx.font = '800 48px system-ui, sans-serif';
    ctx.shadowColor = COLORS.amber;
    ctx.shadowBlur = 24;
    ctx.fillText('The Dark Is Lit', VIEW_WIDTH / 2, 248);
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText('All eight prisms wake. Every level complete.', VIEW_WIDTH / 2, 300);
    ctx.fillStyle = COLORS.amber;
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.fillText(`${game.totalScore} points`, VIEW_WIDTH / 2, 352);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '500 18px system-ui, sans-serif';
    ctx.fillText('Thank you for playing Prismweave.', VIEW_WIDTH / 2, 396);
    const buttons = [
      { id: 'again', label: 'Play Again', x: 500, y: 448, w: 150, h: 44 },
      { id: 'menu', label: 'Menu', x: 670, y: 448, w: 100, h: 44 },
    ];
    for (const b of buttons) drawButton(ctx, b, false);
    ctx.restore();
    return buttons;
  }
}
