import { supabase } from './supabaseClient.js';
import semver from 'semver';

const LOCAL_KEY = 'frontVer';

export async function checkAndUpdate(auto = false) {
  const local = localStorage.getItem(LOCAL_KEY) || '0.0.0';

  const { data, error } = await supabase
    .from('settings')
    .select('front_version, release_path')
    .single();

  if (error) { console.error(error); return; }

  const remote = data.front_version;
  if (semver.lte(remote, local)) {
    if (!auto) alert(`Уже последняя версия (${local})`);
    return;
  }

  // Релиз раздаётся как каталог: releases/1.4.3/index.html
  localStorage.setItem(LOCAL_KEY, remote);
  location.href = '/' + data.release_path + '/';
}
