import { supabase } from './supabaseClient.js';

const LOCAL_KEY = 'frontVer';

function normalizeVersion(value) {
  return String(value || '0.0.0').replace(/^v/, '').trim();
}

function compareVersions(a, b) {
  const aa = normalizeVersion(a).split('.').map((x) => Number(x) || 0);
  const bb = normalizeVersion(b).split('.').map((x) => Number(x) || 0);
  const len = Math.max(aa.length, bb.length);

  for (let i = 0; i < len; i += 1) {
    const x = aa[i] || 0;
    const y = bb[i] || 0;

    if (x > y) return 1;
    if (x < y) return -1;
  }

  return 0;
}

export async function updateBuild(silent = false) {
  try {
    const local = normalizeVersion(localStorage.getItem(LOCAL_KEY));

    const { data, error } = await supabase
      .from('settings')
      .select('front_version, release_path')
      .single();

    if (error) {
      console.error('Update settings error:', error);
      if (!silent) alert('Не удалось проверить обновление.');
      return;
    }

    const remote = normalizeVersion(data.front_version);

    if (compareVersions(remote, local) <= 0) {
      if (!silent) alert('У вас уже последняя версия.');
      return;
    }

    const releasePath = String(data.release_path || '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

    const { data: publicData } = supabase
      .storage
      .from('releases')
      .getPublicUrl(`${releasePath}/index.html`);

    localStorage.setItem(LOCAL_KEY, remote);

    window.location.href = `${publicData.publicUrl}?v=${encodeURIComponent(remote)}`;
  } catch (error) {
    console.error('Update failed:', error);
    if (!silent) alert('Ошибка обновления.');
  }
}

export default updateBuild;
