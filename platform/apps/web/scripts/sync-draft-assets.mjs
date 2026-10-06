import fs from 'fs';
import path from 'path';

export function getSyncPaths(sourceBase, targetBase, slugs) {
  const tasks = [];
  for (const slug of slugs) {
    const src = path.join(sourceBase, slug);
    const dst = path.join(targetBase, slug);
    tasks.push({src, dst});
  }
  return tasks;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      const stat = fs.statSync(srcPath);
      console.log(`Copied ${entry.name} (${(stat.size / 1024).toFixed(2)} KB)`);
    }
  }
}

export function syncDraftAssets(sourceBase, targetBase, slugs) {
  const tasks = getSyncPaths(sourceBase, targetBase, slugs);
  for (const {src, dst} of tasks) {
    if (fs.existsSync(src)) {
      console.log(`Syncing draft assets for ${path.basename(src)}...`);
      copyDir(src, dst);
    } else {
      console.log(`Source ${src} missing, skipping...`);
    }
  }
}

const isMain = process.argv[1] && process.argv[1] === new URL(import.meta.url).pathname;
if (isMain) {
  // actually, let's just make it relative to the script itself
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  // Wait, the prompt says "legacy Vite lab at ../src/ (outside platform/)... with assets in ../public/assets/<name>/"
  // So from platform (monorepo root), the legacy is ../src and ../public
  const monorepoRoot = path.resolve(__dirname, '../../..');
  const legacyAssetsBase = path.join(monorepoRoot, '../public/assets');
  const targetAssetsBase = path.join(monorepoRoot, 'apps/web/public/assets/drafts');

  // get slugs from the registry or just copy all directories in legacyAssetsBase?
  // prompt: "copies ../public/assets/<slug>/ -> apps/web/public/assets/drafts/<slug>/"
  if (fs.existsSync(legacyAssetsBase)) {
    const entries = fs.readdirSync(legacyAssetsBase, {withFileTypes: true});
    const slugs = entries.filter(e => e.isDirectory()).map(e => e.name);
    syncDraftAssets(legacyAssetsBase, targetAssetsBase, slugs);
  } else {
    console.log(`Legacy assets base ${legacyAssetsBase} not found, skipping sync.`);
  }
}
