// Prismweave — the entry program (Node 22, standard library only).
//
// The game lives in this repository as plain static files under game/
// (game/index.html plus its modules, no library, no network request) and
// its screenshots live under screenshots/. This program hands both in: it
// copies them beside this file into the output directory and writes the
// dossier the judge reads, using the vendored make.fun library.
//
// The grader runs this program twice in a fresh container with no network,
// a read-only repository and a writable /output, and both runs must write
// the same bytes. Everything copied here is a committed file, and the
// dossier is a pure function of those files, so the two runs agree.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game locally with `node serve.ts`, then open
// http://localhost:8080 to play it in a desktop browser.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's own limits (the scorer refuses an entry that breaks them):
// at most 4 screenshots, each at most 256 KiB; game/ at most 993 files
// and 48 MiB in all; no path under game/ longer than 1000 bytes. The
// dossier text itself is capped at 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
