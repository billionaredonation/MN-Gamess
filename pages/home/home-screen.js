import { register } from '../../src/router.js';
import { state, save } from '../../src/state.js';
import { getCityConfig, normalizeCityId } from '../../src/cities/index.js';
import { updateBuild } from '../../src/update.js';

const V = '34';                                // версия кэша карт

function money(v) { return v.toLocaleString('ru-RU') + ' грн'; }

register('home', (root) => {
  root.className = 'page home';

  /* ── определяем город пользователя ──────────────────── */
  const normalizedCityId = normalizeCityId(state.city);
  const city             = getCityConfig(normalizedCityId);

  if (state.city !== normalizedCityId) {
    state.city = normalizedCityId;
    save();
  }

  root.dataset.city = city.id;

  /* ── разметка ────────────────────────────────────────── */
  root.innerHTML = `
    <main class="home-gameplay">
      <div class="home-ocean" aria-hidden="true"></div>

      <section class="home-map-stage" aria-label="${city.name}">
        <img class="city-map-image" src="${city.map}?v=${V}" alt="${city.name}" />

        <div class="home-hud home-hud-top">
          <div class="home-city-title">
            <span>${city.region}</span>
            <strong>${city.name}</strong>
          </div>

          <!-- 💡 единственная кнопка -->
          <button class="home-update-btn" id="updateBtn" type="button">Обновить</button>
        </div>
      </section>

      <aside class="home-city-panel" id="homeInfo">
        <div class="home-city-heading">
          <span>Главное меню</span>
          <h3>${city.tagline}</h3>
        </div>

        <div class="home-detail-card">
          <b>${state.nickname || 'Игрок'} в городе ${city.name}</b>
          <p>Нажмите «Обновить», чтобы загрузить последнюю версию игры.</p>
          <small>Стартовый капитал: ${money(city.startMoney)}</small>
        </div>
      </aside>
    </main>
  `;

  /* ── обработчики ─────────────────────────────────────── */
  const cityMapImage = root.querySelector('.city-map-image');
  cityMapImage.addEventListener('error', () => {
    cityMapImage.onerror = null;
    cityMapImage.src = './UkraineMap.png?v=' + V;
  });

  root.querySelector('#updateBtn').onclick = () => updateBuild(false);
});
