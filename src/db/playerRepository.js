import { supabaseRequest } from './supabaseClient.js';
import { getTelegramUser } from '../telegram/User.js';

function normalizePlayerRow(row) {
  if (!row) {
    return null;
  }

  return {
    telegramId: Number(row.telegram_id),
    nickname: row.nickname || '',
    balance: Number(row.balance || 0),
    selectedCity: row.selected_city || null
  };
}

function playerPayload(state, telegramId) {
  return {
    telegram_id: telegramId,
    nickname: state.nickname || state.player?.nickname || '',
    balance: Number(state.player?.money || state.player?.balance || 0),
    selected_city: state.city || state.player?.city || null
  };
}

export async function loadPlayerFromSupabase(telegramId) {
  const query = [
    '/rest/v1/players',
    '?telegram_id=eq.' + encodeURIComponent(telegramId),
    '&select=telegram_id,nickname,balance,selected_city',
    '&limit=1'
  ].join('');

  const rows = await supabaseRequest(query);

  return normalizePlayerRow(rows[0]);
}

export async function savePlayerToSupabase(state) {
  const telegramUser = getTelegramUser();
  const payload = playerPayload(state, telegramUser.telegramId);

  const rows = await supabaseRequest('/rest/v1/players?on_conflict=telegram_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(payload)
  });

  return normalizePlayerRow(rows[0]);
}

export async function syncPlayerFromSupabase(state) {
  const telegramUser = getTelegramUser();
  const remotePlayer = await loadPlayerFromSupabase(telegramUser.telegramId);

  state.telegramId = telegramUser.telegramId;
  state.isTelegram = telegramUser.isTelegram;

  if (remotePlayer) {
    state.nickname = remotePlayer.nickname || state.nickname;
    state.city = remotePlayer.selectedCity || state.city;
    state.player = state.player || {};
    state.player.money = remotePlayer.balance;
    state.player.economyReady = true;
    state.player.telegramId = telegramUser.telegramId;
    return remotePlayer;
  }

  if (!state.nickname && telegramUser.telegramNickname) {
    state.nickname = telegramUser.telegramNickname.slice(0, 8);
  }

  return savePlayerToSupabase(state);
}
