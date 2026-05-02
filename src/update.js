/* src/update.js – загружает свежую сборку из Supabase */
import { supabase } from './supabaseClient.js';
import semver       from 'semver';

const LOCAL_KEY = 'frontVer';

/** Обновить фронт до версии, указанной в таблице settings */
export async function updateBuild(silent = false) {
  const local = localStorage.getItem(LOCAL_KEY) || '0.0.0';

  const { data, error } = await supabase
    .from('settings')
    .select('front_version, release_path')
    .single();

  if (error) {
    console.error('Supabase settings error:', error);
    if (!silent) alert('Не удалось проверить обновление.');
    return;
  }

  if (semver.lte(data.front_version, local)) {
    if (!silent) alert('У вас уже последняя версия.');
    return;
  }

  localStorage.setItem(LOCAL_KEY, data.front_version);
  location.href = '/' + data.release_path + '/';
}

/* чтобы старый код мог делать import updateBuild from './update.js' */
export default updateBuild;
