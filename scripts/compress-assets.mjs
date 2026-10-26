import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('public/assets');

async function processImage(file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;
  if (file.includes('-sm.') || file.includes('-md.') || file.includes('-lg.')) return;

  const baseName = path.basename(file, ext);
  const inputPath = path.join(assetsDir, file);
  const stat = fs.statSync(inputPath);

  console.log(`\nProcessing: ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);

  // Target base name normalized (also kebab-case version if contains spaces)
  const names = [baseName];
  const kebab = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (kebab !== baseName.toLowerCase()) {
    names.push(kebab);
  }

  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width || 1200;

  for (const name of names) {
    // 1. Tier Large / Zoom (lg): up to 1440px, q: 88
    const lgPath = path.join(assetsDir, `${name}-lg.webp`);
    await sharp(inputPath)
      .resize({ width: Math.min(width, 1440), withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(lgPath);

    // 2. Tier Medium / Click (md): up to 720px, q: 82
    const mdPath = path.join(assetsDir, `${name}-md.webp`);
    await sharp(inputPath)
      .resize({ width: Math.min(width, 720), withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(mdPath);

    // 3. Tier Small / Thumbnail (sm): up to 280px, q: 75
    const smPath = path.join(assetsDir, `${name}-sm.webp`);
    await sharp(inputPath)
      .resize({ width: Math.min(width, 280), withoutEnlargement: true })
      .webp({ quality: 75, effort: 4 })
      .toFile(smPath);

    // 4. Default webp (balanced for general usage)
    const defPath = path.join(assetsDir, `${name}.webp`);
    await sharp(inputPath)
      .resize({ width: Math.min(width, 1080), withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toFile(defPath);

    const defStat = fs.statSync(defPath);
    console.log(`  -> Created ${name}.webp (${(defStat.size / 1024).toFixed(1)} KB, saved ${(((stat.size - defStat.size) / stat.size) * 100).toFixed(1)}%)`);
    console.log(`     variants: -sm.webp (${(fs.statSync(smPath).size / 1024).toFixed(1)} KB), -md.webp (${(fs.statSync(mdPath).size / 1024).toFixed(1)} KB), -lg.webp (${(fs.statSync(lgPath).size / 1024).toFixed(1)} KB)`);
  }
}

async function run() {
  const files = fs.readdirSync(assetsDir);
  for (const file of files) {
    try {
      await processImage(file);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  console.log('\n✅ All assets compressed to WebP 3-tier hierarchy successfully!');
}

run();
