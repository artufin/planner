// Builds @planner/ui: tsc emits ESM JS + .d.ts into dist/, then the stylesheet
// is copied alongside it (tsc doesn't know about .css).
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tsc = join(here, '..', '..', 'node_modules', 'typescript', 'bin', 'tsc');

execFileSync(process.execPath, [tsc, '-p', join(here, 'tsconfig.json')], { stdio: 'inherit' });

mkdirSync(join(here, 'dist'), { recursive: true });

const css = readFileSync(join(here, 'src', 'styles.css'), 'utf8');
copyFileSync(join(here, 'src', 'styles.css'), join(here, 'dist', 'styles.css'));

// dist/tokens.css is the `:root` block on its own — the same declarations the
// full stylesheet carries, extracted rather than duplicated so the two can
// never drift. It's what the design tooling picks up as the token layer.
const root = css.match(/^:root\s*\{[\s\S]*?^\}/m);
if (!root) throw new Error('styles.css has no top-level :root block to extract tokens from');
writeFileSync(
    join(here, 'dist', 'tokens.css'),
    `/* @planner/ui design tokens — generated from src/styles.css, do not edit. */\n\n${root[0]}\n`,
);

console.log('built @planner/ui -> dist/ (js + d.ts + styles.css + tokens.css)');
