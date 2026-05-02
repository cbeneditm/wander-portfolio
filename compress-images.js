// ─────────────────────────────────────────────────────────────────────────────
// WANDER PORTFOLIO — Image Compression Script
// Converts JPEGs to WebP and creates gallery thumbnails
// ─────────────────────────────────────────────────────────────────────────────
// Usage:  node compress-images.js
// Run from your project root (where index.html and photos/ folder are)
// ─────────────────────────────────────────────────────────────────────────────

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

// ── CONFIG ──────────────────────────────────────────────────────────────────
const PHOTOS_DIR   = './photos';                  // your original JPEGs
const WEBP_DIR     = './photos/webp';             // full-res WebP output
const THUMBS_DIR   = './photos/webp/thumbs';      // smaller thumbnails for gallery grid
const WEBP_QUALITY = 82;                          // visually identical to JPEG, much smaller
const THUMB_WIDTH  = 800;                         // max width for gallery thumbnails (px)
// ────────────────────────────────────────────────────────────────────────────

// Create output folders if they don't exist
if (!fs.existsSync(WEBP_DIR))   fs.mkdirSync(WEBP_DIR, { recursive: true });
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });

// Get all JPEG files
const files = fs.readdirSync(PHOTOS_DIR).filter(function(f) {
  const ext = f.toLowerCase();
  return ext.endsWith('.jpg') || ext.endsWith('.jpeg');
});

console.log('Found ' + files.length + ' JPEG files in ' + PHOTOS_DIR);
console.log('Converting to WebP (quality ' + WEBP_QUALITY + ') + creating ' + THUMB_WIDTH + 'px thumbnails...\n');

let done       = 0;
let totalSaved = 0;

async function processImage(filename) {
  const inputPath  = path.join(PHOTOS_DIR, filename);
  const webpName   = filename.replace(/\.jpe?g$/i, '.webp');
  const webpPath   = path.join(WEBP_DIR, webpName);
  const thumbPath  = path.join(THUMBS_DIR, webpName);

  const originalSize = fs.statSync(inputPath).size;

  try {
    // Full-resolution WebP (same dimensions as original)
    await sharp(inputPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    // Thumbnail WebP (resized to max THUMB_WIDTH, height auto)
    await sharp(inputPath)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(thumbPath);

    const webpSize  = fs.statSync(webpPath).size;
    const thumbSize = fs.statSync(thumbPath).size;
    const saved     = originalSize - webpSize;
    totalSaved += saved;

    done++;
    const pct      = ((1 - webpSize / originalSize) * 100).toFixed(0);
    const progress = '[' + done + '/' + files.length + ']';
    console.log(
      progress + ' ' + filename +
      '  →  full: ' + formatSize(originalSize) + ' → ' + formatSize(webpSize) + ' (-' + pct + '%)' +
      '  |  thumb: ' + formatSize(thumbSize)
    );
  } catch (err) {
    done++;
    console.error('[' + done + '/' + files.length + '] ERROR: ' + filename + ' — ' + err.message);
  }
}

function formatSize(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function run() {
  // Process 4 images at a time for speed
  const BATCH_SIZE = 4;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(processImage));
  }

  console.log('\n── DONE ──────────────────────────────────────────────');
  console.log('Processed:   ' + done + ' images');
  console.log('Total saved: ' + formatSize(totalSaved) + ' (full-res WebP vs original JPEG)');
  console.log('Output:      ' + WEBP_DIR + '/     (full resolution)');
  console.log('             ' + THUMBS_DIR + '/  (gallery thumbnails)');
  console.log('─────────────────────────────────────────────────────\n');
}

run();
