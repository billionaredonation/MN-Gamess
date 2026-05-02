/* ---------- 1. зависимости ---------- */
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid }   from 'uuid';
import { citiesBase }   from './data/citiesBase.js';

/* ---------- 2. Supabase клиент ---------- */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

/* ---------- 3. постоянные ключи ---------- */
const LS_KEY   = 'mn-game-state';
const DEV_KEY  = 'deviceId';

/* ---------- 4. состояние по умолчанию ---------- */
const defaultState = {
  nickname     : null,
  city         : null,
  cityName     : null,
  regionId     : null,
  player       : {},
  citiesRuntime: {}
};

/* ---------- 5. helpers ---------- */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function deviceId() {
  let id = localStorage.getItem(DEV_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(DEV_KEY, id);
  }
  return id;
}

/* ---------- 6. локальная загрузка ---------- */
function loadLocal() {
  try {
    const saved  = JSON.parse(localStorage.getItem(LS_KEY));
    const loaded = saved ? Object.assign(clone(defaultState), saved)
                         : clone(defaultState);

    const p = loaded.player || {};
    loaded.nickname = loaded.nickname || p.nickname || null;
    loaded.city     = loaded.city     || p.city     || null;
    loaded.cityName = loaded.cityName || p.cityName || null;
    loaded.regionId = loaded.regionId || p.regionId || null;
    return loaded;
  } catch {                       // битые данные – начинаем с чистого
    return clone(defaultState);
  }
}

/* ---------- 7. глобальное состояние ---------- */
export let state = loadLocal();

/* ---------- 8. PUBLIC API ---------- */
export async function loadRemote() {
  /* тянем JSON из БД, объединяем с локальным состоянием */
  const { data, error } = await supabase
    .from('game_state')
    .select('data')
    .eq('device_id', deviceId())
    .single();

  if (error && error.code !== 'PGRST116') {   // 116 = record not found
    console.warn('Supabase load failed → работаем оффлайн', error);
    return;
  }

  if (data?.data) {
    state = Object.assign(clone(defaultState), state, data.data);
    saveLocal();                              // держим LS в актуальном виде
  } else if (!error) {
    /* записи ещё нет → создаём первую строку */
    await saveRemote();                       // no await needed, but keep order
  }
}

export function getState()               { return state; }
export function setState(path, value)    { deepSet(path, value); }
export function updateRuntime(id, patch) {
  state.citiesRuntime[id] = Object.assign({}, state.citiesRuntime[id] || {}, patch);
  save();                                // fire-and-forget
}
export function initRuntime() {
  if (Object.keys(state.citiesRuntime || {}).length) return;
  const blank = {};
  for (const id in citiesBase) blank[id] = {};
  state.citiesRuntime = blank;
  saveLocal();
}

/* ---------- 9. сохранение ---------- */
export function save() {
  saveLocal();
  saveRemote();          // не блокируем игру, поэтому без await
}

/* --- внутренние реализации --- */
function saveLocal() {
  state.player               = state.player || {};
  state.player.nickname      = state.nickname || null;
  state.player.city          = state.city     || null;
  state.player.cityName      = state.cityName || null;
  state.player.regionId      = state.regionId || null;

  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  catch (err) { console.warn('Unable to save to LS', err); }
}

async function saveRemote() {
  const payload = { runtime: state.citiesRuntime };     // лёгкие данные в JSON
  const { error } = await supabase.from('game_state').upsert({
    device_id: deviceId(),
    data     : payload
  });
  if (error) console.warn('Supabase save failed', error);
}

function deepSet(path, value) {
  const keys = path.split('.');
  let o = state;
  keys.slice(0, -1).forEach(k => { if (!o[k]) o[k] = {}; o = o[k]; });
  o[keys.at(-1)] = value;
  save();
}

/* ---------- 10. авто-инициализация ---------- */
loadRemote();              // ⇢ подтянет данные как только приложение загрузится
initRuntime();             // ⇢ запишет пустые runtime для новых городов
