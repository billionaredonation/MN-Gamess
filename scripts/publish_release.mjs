import { createClient } from '@supabase/supabase-js';
import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const supabase = createClient(process.env.SUPA_URL, process.env.SUPA_SERVICE_KEY);
const distDir   = 'dist';
const release   = `releases/${process.env.NEW_VER}`;

for (const file of await fg('**/*', { cwd: distDir, dot: true })) {
  const filePath  = path.join(distDir, file);
  const fileData  = await fs.readFile(filePath);
  const to        = `${release}/${file}`;

  const { error } = await supabase.storage
    .from('releases')
    .upload(to, fileData, { upsert: true, contentType: mime(file) });

  if (error) { console.error(error); process.exit(1); }
  console.log('✓', to);
}

await supabase.from('settings')
  .update({ front_version: process.env.NEW_VER, release_path: release })
  .eq('id', true);

console.log('🎉 Release published:', process.env.NEW_VER);

function mime(f) {
  return f.endsWith('.html') ? 'text/html'
       : f.endsWith('.js')   ? 'text/javascript'
       : f.endsWith('.css')  ? 'text/css'
       : 'application/octet-stream';
}
