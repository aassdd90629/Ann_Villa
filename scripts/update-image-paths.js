import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

const filesToUpdate = [
  'src/data/facilities.json',
  'src/data/guide.json',
  'src/data/hero-slides.json',
  'src/data/rooms.json',
  'src/views/HomeView.vue',
  'migrations/0005_create_media_assets.sql',
  'functions/api/admin/media.js',
  'public/img/image-map.json'
];

for (const rel of filesToUpdate) {
  const fullPath = path.join(projectRoot, rel);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[Skip] File not found: ${rel}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  // Replace /img/.../*.jpg or /img/.../*.jpeg with .webp
  const updatedContent = content.replace(/(\/img\/[a-zA-Z0-9_\-\/]+)\.(jpg|jpeg)/gi, '$1.webp');

  if (content !== updatedContent) {
    fs.writeFileSync(fullPath, updatedContent, 'utf8');
    console.log(`[Updated] ${rel}`);
  } else {
    console.log(`[No Change] ${rel}`);
  }
}

console.log('[Complete] All image reference paths successfully updated to .webp!');
