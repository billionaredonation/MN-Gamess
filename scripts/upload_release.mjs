import { createClient }        from '@supabase/supabase-js';
import fg                      from 'fast-glob';
import fs                      from 'fs/promises';
import { fileTypeFromBuffer }  from 'file-type';

const { SUPA_URL, SUPA_SERVICE_KEY, NEW_VER } = process.env;

if (!SUPA_URL || !SUPA_SERVICE_KEY || !NEW_VER) {
  console.error('Missing env: SUPA_URL / SUPA_SERVICE_KEY / NEW_VER');
  process.exit(1);
}

const ver  = NEW_VER.replace(/^v/, '');                 // v1.0.9 → 1.0.9
const supa = createClient(SUPA_URL, SUPA_SERVICE_KEY);

function mime(name, buf) {
  if (name.endsWith('.html')) return 'text/html';
  if (name.endsWith('.js'))   return 'text/javascript';
  if (name.endsWith('.css'))  return 'text/css';
  if (name.endsWith('.svg'))  return 'image/svg+xml';
  if (name.endsWith('.json')) return 'application/json';
  return fileTypeFromBuffer(buf)?.mime || 'application/octet-stream';
}

const files = await fg('**/*', { cwd: 'dist', dot: true });

for (const f of files) {
  const data = await fs.readFile(`dist/${f}`);

  const { error } = await supa.storage
    .from('releases')
    .upload(`releases/${ver}/${f}`, data, {
      upsert:      true,
      contentType: mime(f, data)
    });

  if (error) {
    console.error('upload failed:', f, error);
    process.exit(1);
  }
  console.log('uploaded', f);
}

const { error: settingsError } = await supa
  .from('settings')
  .update({ front_version: ver, release_path: `releases/${ver}` })
  .eq('id', true);

if (settingsError) {
  console.error('settings update failed:', settingsError);
  process.exit(1);
}

console.log(`✅ switched to ${ver}`);
