import { citiesBase } from './data/citiesBase.js';

const LS_KEY = 'mn-game-state';
const DB_SCHEMA_VERSION = 1;

let remoteSyncQueue = Promise.resolve();

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

function createDefaultState() {
  return {
    schemaVersion: DB_SCHEMA_VERSION,
    nickname: null,
    city: null,
    cityName: null,
    regionId: null,
    telegramId: null,
    isTelegram: false,
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

function normalizeState(savedState) {
  const defaults = createDefaultState();
  const nextState = Object.assign({}, defaults, savedState || {});

  nextState.schemaVersion = DB_SCHEMA_VERSION;
  nextState.player = mergePlayer(defaults.player, savedState?.player);
  nextState.citiesRuntime = mergeCitiesRuntime(defaults.citiesRuntime, savedState?.citiesRuntime);

  nextState.nickname = nextState.nickname || nextState.player.nickname || null;
  nextState.city = nextState.city || nextState.player.city || null;
  nextState.cityName = nextState.cityName || nextState.player.cityName || null;
  nextState.regionId = nextState.regionId || nextState.player.regionId || null;

  return nextState;
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const savedState = raw ? JSON.parse(raw) : null;

    return normalizeState(savedState);
  } catch (error) {
    return createDefaultState();
  }
}

function syncPlayerIdentity() {
  state.player = state.player || {};
  state.player.nickname = state.nickname || null;
  state.player.city = state.city || null;
  state.player.cityName = state.cityName || null;
  state.player.regionId = state.regionId || null;
}

export let state = loadLocalState();

export function save() {
  syncPlayerIdentity();

  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save game state', error);
  }
}

export function getState() {
  return state;
}

export function setState(path, value) {
  const keys = path.split('.');
  let target = state;

  keys.slice(0, -1).forEach((key) => {
    if (!target[key]) target[key] = {};
    target = target[key];
  });

  target[keys[keys.length - 1]] = value;
  save();
}

export function updateRuntime(cityId, patch) {
  state.citiesRuntime[cityId] = Object.assign({}, state.citiesRuntime[cityId] || {}, patch);
  save();
}

export function initRuntime() {
  state.citiesRuntime = mergeCitiesRuntime(createCitiesRuntime(), state.citiesRuntime);
  save();
}

export function resetState() {
  localStorage.removeItem(LS_KEY);
  state = createDefaultState();
}

export async function initRemotePlayer() {
  try {
    const module = await import('./db/playerRepository.js?v=110');
    await module.syncPlayerFromSupabase(state);
    save();
  } catch (error) {
    console.warn('Unable to load player from Supabase', error);
  }
}

export function syncPlayerRemote() {
  remoteSyncQueue = remoteSyncQueue
    .then(async () => {
      const module = await import('./db/playerRepository.js?v=110');
      return module.savePlayerToSupabase(state);
    })
    .catch((error) => {
      console.warn('Unable to save player to Supabase', error);
    });

  return remoteSyncQueue;
}


