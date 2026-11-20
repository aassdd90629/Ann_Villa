import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicImgDir = path.resolve(__dirname, '../public/img');
const backupDir = path.resolve(__dirname, '../backup_jpgs');

function getAllJpgFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllJpgFiles(fullPath));
    } else if (/\.(jpg|jpeg)$/i.test(item)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function convert() {
  console.log(`[WebP Converter] Scanning ${publicImgDir}...`);
  const jpgFiles = getAllJpgFiles(publicImgDir);
  console.log(`[WebP Converter] Found ${jpgFiles.length} JPG images.`);

  let totalOrigBytes = 0;
  let totalWebpBytes = 0;
  let successCount = 0;

  for (const jpgPath of jpgFiles) {
    const relPath = path.relative(publicImgDir, jpgPath);
    const targetBackupPath = path.join(backupDir, relPath);
    const webpPath = jpgPath.replace(/\.(jpg|jpeg)$/i, '.webp');

    // 1. Ensure backup directory exists & copy original file
    fs.mkdirSync(path.dirname(targetBackupPath), { recursive: true });
    fs.copyFileSync(jpgPath, targetBackupPath);

    const origStat = fs.statSync(jpgPath);
    totalOrigBytes += origStat.size;

    // 2. Convert to WebP using sharp (quality: 82, effort: 4)
    await sharp(jpgPath)
      .webp({ quality: 82, effort: 4 })
      .toFile(webpPath);

    const webpStat = fs.statSync(webpPath);
    totalWebpBytes += webpStat.size;

    // 3. Delete original JPG in public/img
    fs.unlinkSync(jpgPath);

    successCount++;
    const savedPercent = (((origStat.size - webpStat.size) / origStat.size) * 100).toFixed(1);
    console.log(`[${successCount}/${jpgFiles.length}] Converted: ${relPath} -> .webp (${(origStat.size/1024).toFixed(0)}KB -> ${(webpStat.size/1024).toFixed(0)}KB, -${savedPercent}%)`);
  }

  console.log('\n=============================================');
  console.log(`Successfully converted ${successCount} files!`);
  console.log(`Original total: ${(totalOrigBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`WebP total:     ${(totalWebpBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Space saved:    ${(((totalOrigBytes - totalWebpBytes) / totalOrigBytes) * 100).toFixed(1)}%`);
  console.log(`Original JPGs safely backed up in: ${backupDir}`);
  console.log('=============================================\n');
}

convert().catch(err => {
  console.error('[WebP Converter Error]:', err);
  process.exit(1);
});
