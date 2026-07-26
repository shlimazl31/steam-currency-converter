import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));

if (manifest.manifest_version !== 3) throw new Error('manifest_version must be 3');
if (manifest.version !== '1.0.0') throw new Error('Manifest version must match the UI version');
if (!manifest.host_permissions.includes('https://api.frankfurter.dev/*')) throw new Error('Frankfurter host permission missing');
if (!manifest.content_scripts.some((entry) => entry.matches.includes('https://store.steampowered.com/*'))) throw new Error('Steam content script missing');

const referencedFiles = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap((entry) => [...entry.js, ...entry.css])
];
for (const relativePath of referencedFiles) await access(join(root, relativePath));

const expectedLocales = ['de', 'en', 'es', 'fr', 'pt_BR', 'ru', 'tr'];
const actualLocales = (await readdir(join(root, '_locales'))).sort();
if (JSON.stringify(actualLocales) !== JSON.stringify(expectedLocales)) throw new Error(`Unexpected locales: ${actualLocales.join(', ')}`);

const baseKeys = Object.keys(JSON.parse(await readFile(join(root, '_locales/en/messages.json'), 'utf8'))).sort();
for (const locale of actualLocales) {
  const messages = JSON.parse(await readFile(join(root, `_locales/${locale}/messages.json`), 'utf8'));
  if (JSON.stringify(Object.keys(messages).sort()) !== JSON.stringify(baseKeys)) throw new Error(`Locale keys differ: ${locale}`);
}

const popup = await readFile(join(root, 'popup/popup.html'), 'utf8');
if (!popup.includes('https://www.patreon.com/16358118/join')) throw new Error('Patreon URL missing');
if (!popup.includes('v1.0.0')) throw new Error('Popup version must match manifest');

console.log(`Manifest, ${actualLocales.length} locales, referenced files and external links are valid.`);
