import { citiesBase } from './data/citiesBase.js';
import { supabase }   from './supabaseClient.js';

/* ---------- 1. ключи локального хранилища ---------- */
const LS_KEY  = 'mn-game-state';
const DEV_KEY = 'deviceId';

/* ---------- 2. состояние по умолчанию ---------- */
const defaultState = {
  nickname:      null,
  city:          null,
  cityName:      null,
  regionId:      null,
  player:        {},
  citiesRuntime: {}
};

/* ---------- 3. helpers ---------- */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function makeDeviceId() {
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDeviceId() {
  let id = localStorage.getItem(DEV_KEY);
  if (!id) {
    id = makeDeviceId();
    localStorage.setItem(DEV_KEY, id);
  }
  return id;
}

function normalizeLoadedState(loaded) {
  loaded.player        = loaded.player        || {};
  loaded.citiesRuntime = loaded.citiesRuntime || {};

  loaded.nickname = loaded.nickname || loaded.player.nickname || null;
  loaded.city     = loaded.city     || loaded.player.city     || null;
  loaded.cityName = loaded.cityName || loaded.player.cityName || null;
  loaded.regionId = loaded.regionId || loaded.player.regionId || null;

  return loaded;
}

/* ---------- 4. локальная загрузка ---------- */
function loadLocal() {
  try {
    const savedRaw = localStorage.getItem(LS_KEY);
    const saved    = savedRaw ? JSON.parse(savedRaw) : null;
    const loaded   = saved
      ? Object.assign(clone(defaultState), saved)
      : clone(defaultState);

    return normalizeLoadedState(loaded);
  } catch (error) {
    console.warn('Unable to load local state', error);
    return clone(defaultState);
  }
}

/* ---------- 5. глобальное состояние ---------- */
export let state = loadLocal();

export function getState() {
  return state;
}

/* ---------- 6. удалённая загрузка ---------- */
export async function loadRemote() {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('data')
      .eq('device_id', getDeviceId())
      .maybeSingle();

    if (error) {
      console.warn('Supabase load failed. Local state used.', error);
      return;
    }

    if (!data || !data.data) {
      // записи ещё нет → создаём первую
      await saveRemote();
      return;
    }

    const remoteData = data.data;

    const merged = Object.assign(
      clone(defaultState),
      state,
      remoteData
    );

    // обратная совместимость со старым форматом payload-а
    if (remoteData.runtime && !remoteData.citiesRuntime) {
      merged.citiesRuntime = remoteData.runtime;
    }

    state = normalizeLoadedState(merged);
    saveLocal();
  } catch (error) {
    console.warn('Remote load crashed. Local state used.', error);
  }
}

/* ---------- 7. сохранение ---------- */
export function save() {
  saveLocal();
  saveRemote();   // fire-and-forget
}

function saveLocal() {
  state.player          = state.player || {};
  state.player.nickname = state.nickname || null;
  state.player.city     = state.city     || null;
  state.player.cityName = state.cityName || null;
  state.player.regionId = state.regionId || null;

  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save game state locally', error);
  }
}

async function saveRemote() {
  try {
    const { error } = await supabase
      .from('game_state')
      .upsert({
        device_id:  getDeviceId(),
        data:       state,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Supabase save failed', error);
    }
  } catch (error) {
    console.warn('Remote save crashed', error);
  }
}

/* ---------- 8. mutators ---------- */
export function setState(path, value) {
  const keys = path.split('.');
  let obj = state;

  keys.slice(0, -1).forEach((key) => {
    if (!obj[key]) obj[key] = {};
    obj = obj[key];
  });

  obj[keys[keys.length - 1]] = value;
  save();
}

export function updateRuntime(cityId, patch) {
  state.citiesRuntime = state.citiesRuntime || {};
  state.citiesRuntime[cityId] = Object.assign(
    {},
    state.citiesRuntime[cityId] || {},
    patch
  );
  save();
}

export function initRuntime() {
  state.citiesRuntime = state.citiesRuntime || {};
  if (Object.keys(state.citiesRuntime).length) return;

  const blank = {};
  for (const id in citiesBase) blank[id] = {};

  state.citiesRuntime = blank;
  save();
}

/* ---------- 9. авто-инициализация ---------- */
// подтянем удалённое состояние, как только модуль импортируется.
// если связи нет — продолжаем работать на локальных данных.
loadRemote();
