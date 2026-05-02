const DEV_TELEGRAM_ID_KEY = 'mn-game-dev-telegram-id';

function getDevTelegramId() {
  const savedId = localStorage.getItem(DEV_TELEGRAM_ID_KEY);

  if (savedId) {
    return Number(savedId);
  }

  const nextId = Date.now();

  localStorage.setItem(DEV_TELEGRAM_ID_KEY, String(nextId));
  return nextId;
}

export function getTelegramUser() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (user?.id) {
    return {
      telegramId: Number(user.id),
      telegramNickname: user.username || user.first_name || '',
      isTelegram: true
    };
  }

  return {
    telegramId: getDevTelegramId(),
    telegramNickname: '',
    isTelegram: false
  };
}

