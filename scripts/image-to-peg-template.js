// Converts a filled-shape image (PNG/JPG) into a PEG_TEMPLATES entry: resizes the
// image straight to the peg grid's column/row count (that resize *is* the sampling —
// each output pixel represents one grid cell) and thresholds brightness into 'X'/'.'.
// Prints a paste-ready snippet; does not edit gameConfig.js itself.
//
// Usage: node scripts/image-to-peg-template.js <imagePath> [--id=name] [--cols=11] [--threshold=128] [--invert]

import sharp from 'sharp';
import { PEG_FIELD, PEG_TYPES } from '../src/config/gameConfig.js';

const TOTAL_SPECIAL_PEGS = PEG_TYPES.reduce((sum, t) => sum + (t.count === 'rest' ? 0 : t.count), 0);

function parseArgs(argv) {
  const [imagePath, ...rest] = argv;
  const opts = { id: 'imported', cols: 11, threshold: 128, invert: false };
  for (const arg of rest) {
    if (arg === '--invert') opts.invert = true;
    else if (arg.startsWith('--id=')) opts.id = arg.slice('--id='.length);
    else if (arg.startsWith('--cols=')) opts.cols = Number(arg.slice('--cols='.length));
    else if (arg.startsWith('--threshold=')) opts.threshold = Number(arg.slice('--threshold='.length));
  }
  return { imagePath, ...opts };
}

const { imagePath, id, cols, threshold, invert } = parseArgs(process.argv.slice(2));

if (!imagePath) {
  console.log('Usage: node scripts/image-to-peg-template.js <imagePath> [--id=name] [--cols=11] [--threshold=128] [--invert]');
  process.exit(1);
}

const rowCount = PEG_FIELD.rows;

const { data } = await sharp(imagePath)
  .resize(cols, rowCount, { fit: 'fill' })
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

const rows = [];
let openCells = 0;
let maxConsecutiveSolidRows = 0;
let consecutiveSolidRows = 0;

for (let r = 0; r < rowCount; r++) {
  let line = '';
  for (let c = 0; c < cols; c++) {
    const brightness = data[r * cols + c];
    const filled = invert ? brightness >= threshold : brightness < threshold;
    line += filled ? 'X' : '.';
    if (filled) openCells++;
  }
  rows.push(line);

  const isFullySolid = !line.includes('.');
  consecutiveSolidRows = isFullySolid ? consecutiveSolidRows + 1 : 0;
  maxConsecutiveSolidRows = Math.max(maxConsecutiveSolidRows, consecutiveSolidRows);
}

console.log(`\nPreview (${cols}x${rowCount}):\n`);
console.log(rows.join('\n'));

console.log('\nPaste into PEG_TEMPLATES in src/config/gameConfig.js:\n');
console.log(`  {\n    id: '${id}',\n    rows: [${rows.map((r) => `'${r}'`).join(', ')}],\n  },`);

console.log('');
if (openCells < TOTAL_SPECIAL_PEGS) {
  console.warn(
    `Warning: ${openCells} open cells, fewer than the ${TOTAL_SPECIAL_PEGS} special pegs PEG_TYPES needs to place — createPegField will throw at runtime with this template.`
  );
}
if (maxConsecutiveSolidRows >= 2) {
  console.warn('Warning: 2+ consecutive fully-solid rows — the zigzag stagger can close the gaps enough to wall off the ball.');
}
if (openCells < 20) {
  console.warn(`Warning: only ${openCells} open cells — aim for at least ~20 so special peg tiers have room to spread out.`);
}
