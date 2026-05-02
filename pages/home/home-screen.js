/* pages/home/home-screen.js – карта + одна кнопка «Обновить» */
import { register }          from '../../src/router.js';
import { state, save }       from '../../src/state.js';
import { updateBuild }       from '../../src/update.js';
import { getCityConfig,
         normalizeCityId }   from '../../src/cities/index.js';

const V = '34';                               // кеш-метка карт

const money = (v = 0) => v.toLocaleString('ru-RU') + ' ₴';

register('home', (root) => {
  root.className = 'page home';

  /* ── город игрока ───────────────────────────────────── */
  const normalized = normalizeCityId(state.city);
  const city       = getCityConfig(normalized);

  if (state.city !== normalized) {
    state.city = normalized;
    save();
  }
  root.dataset.city = city.id;

  /* ── разметка ───────────────────────────────────────── */
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

          <button class="home-update-btn" id="updateBtn" type="button">
            Обновить
          </button>
        </div>
      </section>

      <aside class="home-city-panel">
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

  /* ── запасная карта ─────────────────────────────────── */
  const img = root.querySelector('.city-map-image');
  img.addEventListener('error', () => {
    img.onerror = null;
    img.src = './UkraineMap.png?v=' + V;
  });

  /* ── кнопка «Обновить» ─────────────────────────────── */
  root.querySelector('#updateBtn').onclick = () => updateBuild(false);
});
