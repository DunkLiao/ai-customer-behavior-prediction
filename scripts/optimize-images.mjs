import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const inputDir = path.join(root, 'infographics');
const fullOutputDir = path.join(inputDir, 'webp');
const thumbnailOutputDir = path.join(inputDir, 'thumbs');

await fs.mkdir(fullOutputDir, { recursive: true });
await fs.mkdir(thumbnailOutputDir, { recursive: true });

const inputFiles = (await fs.readdir(inputDir))
  .filter((file) => file.toLowerCase().endsWith('.png'))
  .sort((a, b) => a.localeCompare(b));

await Promise.all(inputFiles.map(async (file) => {
  const sourcePath = path.join(inputDir, file);
  const basename = path.basename(file, path.extname(file));
  const fullOutputPath = path.join(fullOutputDir, `${basename}.webp`);
  const thumbnailOutputPath = path.join(thumbnailOutputDir, `${basename}.webp`);

  await sharp(sourcePath)
    .webp({ quality: 82, effort: 5 })
    .toFile(fullOutputPath);

  await sharp(sourcePath)
    .resize({ width: 300, height: 200, fit: 'cover' })
    .webp({ quality: 65, effort: 5 })
    .toFile(thumbnailOutputPath);
}));

console.log(`Generated ${inputFiles.length} full-size WebP files and ${inputFiles.length} thumbnails.`);
