import { supabase } from './supabaseClient.js';
import semver from 'semver';

const LOCAL = 'frontVer';

export async function updateBuild(silent = false) {
  const local = localStorage.getItem(LOCAL) || '0.0.0';

  const { data, error } = await supabase
    .from('settings')
    .select('front_version, release_path')
    .single();
  if (error) { console.error(error); return; }

  if (semver.lte(data.front_version, local)) {
    if (!silent) alert('Уже последняя версия');
    return;
  }

  localStorage.setItem(LOCAL, data.front_version);
  location.href = '/' + data.release_path + '/';
}
