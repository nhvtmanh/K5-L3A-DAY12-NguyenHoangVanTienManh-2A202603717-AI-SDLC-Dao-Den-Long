import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const sections = ['Third-party notices from installed dependencies.\nOriginal notices retain their licenses and owners.\nRegenerate: node scripts/third-party-notices.mjs\n'];
for (const [path, info] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!path) continue;
  let files;
  try { files = readdirSync(path).filter(file => /^(license|copying|notice)(\.|$)/i.test(file)); }
  catch { continue; } // Optional dependencies for another OS are not installed/distributed here.
  const name = path.split('node_modules/').at(-1);
  sections.push(`\n===== ${name} ${info.version} (${info.license ?? 'see notices'}) =====\n`);
  for (const file of files) sections.push(`\n--- ${file} ---\n${readFileSync(join(path, file), 'utf8')}\n`);
}
writeFileSync('THIRD_PARTY_NOTICES.txt', sections.join(''));
console.log('THIRD_PARTY_NOTICES.txt generated from installed package notices.');
