/**
 * Script to slice the AI-generated shadow_sprite_sheet.png into
 * two clean horizontal sprite strips:
 *   1. shadow_walk.png  — 6 walking frames (row 1)
 *   2. shadow_sit.png   — 4 sitting-on-sofa frames (row 3, the final sitting poses)
 *
 * Source image: 640x640, 3 rows
 *   Row 1: 6 walking frames  (each ~106x213)
 *   Row 2: 4 stand-to-sit transition frames (each ~160x213)  
 *   Row 3: 4 sitting poses   (each ~160x213)
 */

const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public', 'shadow_sprite_sheet.png');
const OUT_DIR = path.join(__dirname, '..', 'public');

const IMG_W = 640;
const IMG_H = 640;
const ROW_H = Math.floor(IMG_H / 3); // ~213

// --- Row 1: 6 walk frames ---
const WALK_COLS = 6;
const WALK_FW = Math.floor(IMG_W / WALK_COLS); // ~106

// --- Row 3: 4 sit frames ---
const SIT_COLS = 4;
const SIT_FW = Math.floor(IMG_W / SIT_COLS); // 160

// Target frame size (uniform square for in-game use)
const FRAME_SIZE = 64;

async function main() {
  // ── Walk strip ──────────────────────────────
  const walkFrames = [];
  for (let i = 0; i < WALK_COLS; i++) {
    const frame = await sharp(SRC)
      .extract({ left: i * WALK_FW, top: 0, width: WALK_FW, height: ROW_H })
      .resize(FRAME_SIZE, FRAME_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    walkFrames.push(frame);
  }

  // Composite walk frames side by side
  const walkStripWidth = FRAME_SIZE * WALK_COLS;
  const walkComposites = walkFrames.map((buf, i) => ({
    input: buf,
    left: i * FRAME_SIZE,
    top: 0,
  }));

  await sharp({
    create: { width: walkStripWidth, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(walkComposites)
    .png()
    .toFile(path.join(OUT_DIR, 'shadow_walk.png'));

  console.log(`✅ shadow_walk.png created (${walkStripWidth}x${FRAME_SIZE}, ${WALK_COLS} frames)`);

  // ── Sit strip ───────────────────────────────
  const sitFrames = [];
  for (let i = 0; i < SIT_COLS; i++) {
    const frame = await sharp(SRC)
      .extract({ left: i * SIT_FW, top: ROW_H * 2, width: SIT_FW, height: ROW_H })
      .resize(FRAME_SIZE, FRAME_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    sitFrames.push(frame);
  }

  const sitStripWidth = FRAME_SIZE * SIT_COLS;
  const sitComposites = sitFrames.map((buf, i) => ({
    input: buf,
    left: i * FRAME_SIZE,
    top: 0,
  }));

  await sharp({
    create: { width: sitStripWidth, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(sitComposites)
    .png()
    .toFile(path.join(OUT_DIR, 'shadow_sit.png'));

  console.log(`✅ shadow_sit.png created (${sitStripWidth}x${FRAME_SIZE}, ${SIT_COLS} frames)`);

  // ── Single sit frame (default) ──────────────
  // Extract just frame index 2 from row 3 (person sitting with coffee — nice pose)
  await sharp(SRC)
    .extract({ left: 2 * SIT_FW, top: ROW_H * 2, width: SIT_FW, height: ROW_H })
    .resize(FRAME_SIZE, FRAME_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'shadow_sit_single.png'));

  console.log('✅ shadow_sit_single.png created (single frame for quick use)');
}

main().catch(console.error);
