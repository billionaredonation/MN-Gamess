import { citiesBase } from '../data/citiesBase.js';

export const DB_KEY = 'mn-game-state';
export const DB_SCHEMA_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCitiesRuntime() {
  const runtime = {};

  for (const id in citiesBase) {
    runtime[id] = {
      unlocked: true,
      reputation: 0,
      investments: 0,
      businesses: []
    };
  }

  return runtime;
}

export function createDefaultState() {
  return {
    schemaVersion: DB_SCHEMA_VERSION,
    nickname: null,
    city: null,
    cityName: null,
    regionId: null,
    player: {
      money: 0,
      energy: 100,
      level: 1,
      xp: 0,
      skills: {},
      stats: {},
      settings: {}
    },
    citiesRuntime: createCitiesRuntime()
  };
}

function mergePlayer(defaultPlayer, savedPlayer) {
  const player = Object.assign({}, defaultPlayer, savedPlayer || {});

  player.skills = Object.assign({}, defaultPlayer.skills, savedPlayer?.skills || {});
  player.stats = Object.assign({}, defaultPlayer.stats, savedPlayer?.stats || {});
  player.settings = Object.assign({}, defaultPlayer.settings, savedPlayer?.settings || {});

  return player;
}

function mergeCitiesRuntime(defaultRuntime, savedRuntime) {
  const runtime = clone(defaultRuntime);

  for (const id in savedRuntime || {}) {
    runtime[id] = Object.assign({}, runtime[id] || {}, savedRuntime[id] || {});
    runtime[id].businesses = Array.isArray(runtime[id].businesses) ? runtime[id].businesses : [];
  }

  return runtime;
}

export function normalizeState(savedState) {
  const defaults = createDefaultState();
  const state = Object.assign({}, defaults, savedState || {});

  state.schemaVersion = DB_SCHEMA_VERSION;
  state.player = mergePlayer(defaults.player, savedState?.player);
  state.citiesRuntime = mergeCitiesRuntime(defaults.citiesRuntime, savedState?.citiesRuntime);

  state.nickname = state.nickname || state.player.nickname || null;
  state.city = state.city || state.player.city || null;
  state.cityName = state.cityName || state.player.cityName || null;
  state.regionId = state.regionId || state.player.regionId || null;

  return state;
}

export function loadGameDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    const savedState = raw ? JSON.parse(raw) : null;

    return normalizeState(savedState);
  } catch (error) {
    return createDefaultState();
  }
}

export function saveGameDb(state) {
  syncPlayerIdentity(state);

  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save game db', error);
  }
}

export function resetGameDb() {
  localStorage.removeItem(DB_KEY);
  return createDefaultState();
}

export function setDbPath(state, path, value) {
  const keys = path.split('.');
  let target = state;

  keys.slice(0, -1).forEach((key) => {
    if (!target[key]) target[key] = {};
    target = target[key];
  });

  target[keys[keys.length - 1]] = value;
  saveGameDb(state);
}

export function patchCityRuntime(state, cityId, patch) {
  const current = state.citiesRuntime[cityId] || {};

  state.citiesRuntime[cityId] = Object.assign({}, current, patch);
  saveGameDb(state);
}

export function ensureRuntimeCities(state) {
  state.citiesRuntime = mergeCitiesRuntime(createCitiesRuntime(), state.citiesRuntime);
  saveGameDb(state);
}

export function syncPlayerIdentity(state) {
  state.player = state.player || {};
  state.player.nickname = state.nickname || null;
  state.player.city = state.city || null;
  state.player.cityName = state.cityName || null;
  state.player.regionId = state.regionId || null;
}
