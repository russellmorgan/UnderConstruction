# Peg template image converter

Turn a simple filled-shape image into a new `PEG_TEMPLATES` entry for [src/config/gameConfig.js](../src/config/gameConfig.js).

## Steps

1. **Make an image.** Any PNG or JPG where the filled area marks "pegs go here" — a simple black shape on a white background works well (e.g. draw one in any image editor, or export a filled shape from a design tool). Keep it simple; it gets downsampled to an ~11×8 grid, so fine detail won't survive.
2. **Run the script:**
   ```
   node scripts/image-to-peg-template.js path/to/shape.png --id=myShape
   ```
3. **Check the terminal output** — it prints an ASCII preview so you can sanity-check the shape before using it, plus any warnings (see below).
4. **Copy the printed snippet** into the `PEG_TEMPLATES` array in `src/config/gameConfig.js`, right alongside the existing `full`/`diamond`/`hourglass`/etc. entries.
5. **Playtest:** `npm run dev`, hit Start a few times until your new shape comes up, and drop a couple of balls to confirm it plays fine.

## Flags

- `--id=name` — the template's `id` in the output snippet (default `imported`).
- `--cols=11` — grid width to sample down to (default matches the current board).
- `--threshold=128` — brightness cutoff (0–255) for what counts as "filled." Lower it if too much gets marked as peg, raise it if too little does.
- `--invert` — use this if your shape is drawn light-on-dark (white fill on a black background) instead of dark-on-light.

## Warnings to watch for

- **"fewer than N special pegs"** — the shape doesn't have enough open cells for all the multiplier/penalty pegs to be placed. Make the shape bigger/fuller or lower `--threshold`.
- **"2+ consecutive fully-solid rows"** — two solid rows in a row can wall off the ball's path given the board's zigzag peg stagger. Thin out one of those rows.
- **"only N open cells"** — aim for at least ~20 so the special pegs have room to spread out.

None of these block you from pasting the snippet in, but they're worth fixing before shipping a shape.
