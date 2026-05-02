import { register, show } from '../../src/router.js';
import { state, save } from '../../src/state.js';
import { normalizeCityId } from '../../src/cities/index.js';

const V = '113';

const cityLoaders = {
  kyiv: () => import('../../src/cities/kyiv/index.js?v=113'),
  dnipro: () => import('../../src/cities/dnipro/index.js?v=113'),
  donetsk: () => import('../../src/cities/donetsk/index.js?v=113'),
  kharkiv: () => import('../../src/cities/kharkiv/index.js?v=113'),
  luhansk: () => import('../../src/cities/luhansk/index.js?v=113'),
  lutsk: () => import('../../src/cities/lutsk/index.js?v=113'),
  lviv: () => import('../../src/cities/lviv/index.js?v=113'),
  odesa: () => import('../../src/cities/odesa/index.js?v=113'),
  vinnytsia: () => import('../../src/cities/vinnytsia/index.js?v=113'),
  zaporizhzhia: () => import('../../src/cities/zaporizhzhia/index.js?v=113'),
  zhytomyr: () => import('../../src/cities/zhytomyr/index.js?v=113'),
};

function money(value) {
  return Number(value || 0).toLocaleString('ru-RU') + ' грн';
}

function renderJobs(city) {
  return city.jobs.map((job) => `
    <button class="home-job" data-job-id="${job.id}">
      <strong>${job.title}</strong>
      <span>${job.description}</span>
      <b>${money(job.pay)} / смена</b>
    </button>
  `).join('');
}

async function loadSelectedCity() {
  const normalizedCityId = normalizeCityId(state.city || 'zaporizhzhia');
  const loader = cityLoaders[normalizedCityId] || cityLoaders.zaporizhzhia;

  const module = await loader();
  const city = module.city;

  state.city = city.id;
  save();

  return city;
}

register('home', async (root) => {
  root.className = 'page home';
  root.innerHTML = `
    <section class="home-loading">
      <h1>Загрузка города...</h1>
      <p>Подключаем главное меню.</p>
    </section>
  `;

  const city = await loadSelectedCity();

  root.dataset.city = city.id;
  root.innerHTML = `
    <section class="home-shell">
      <header class="home-top">
        <div>
          <div class="home-region">${city.region}</div>
          <h1>${city.name}</h1>
        </div>

        <button id="resetBtn" class="home-reset">Сброс</button>
      </header>

      <div class="home-map-card">
        <img class="city-map-image" src="${city.map}?v=${V}" alt="${city.name}">
      </div>

      <nav class="home-menu">
        <button id="profileBtn">Профиль</button>
        <button id="jobsBtn">Работы</button>
        <button id="houseBtn">Дома</button>
        <button id="settingsBtn">Настройки</button>
      </nav>

      <main id="homeInfo" class="home-info">
        <h2>Главное меню</h2>
        <h3>${city.tagline}</h3>
        <p>Добро пожаловать, ${state.nickname || 'игрок'}.</p>

        <div class="home-feature">
          <strong>${city.specialty.label}: ${city.specialty.value}</strong>
          <p>${city.specialty.description}</p>
        </div>

        <h3>Работы города</h3>
        <div class="home-jobs">
          ${renderJobs(city)}
        </div>
      </main>
    </section>
  `;

  const img = root.querySelector('.city-map-image');
  img.addEventListener('error', () => {
    img.onerror = null;
    img.src = './UkraineMap.png?v=' + V;
  });

  root.querySelector('#resetBtn').onclick = resetProgress;
  root.querySelector('#profileBtn').onclick = () => showProfile(root, city);
  root.querySelector('#jobsBtn').onclick = () => showJobs(root, city);
  root.querySelector('#houseBtn').onclick = () => showHousing(root, city);
  root.querySelector('#settingsBtn').onclick = () => showSettings(root, city);

  root.querySelector('#homeInfo').addEventListener('click', (event) => {
    const button = event.target.closest('.home-job');
    if (!button) return;

    const job = city.jobs.find((item) => item.id === button.dataset.jobId);
    if (job) showJob(root, city, job);
  });
});

function setPanel(root, html) {
  root.querySelector('#homeInfo').innerHTML = html;
}

function showProfile(root, city) {
  setPanel(root, `
    <h2>Профиль</h2>
    <h3>${state.nickname || 'Игрок'} в городе ${city.name}</h3>
    <p>${city.profileTitle}</p>
    <p>${city.profileText}</p>
    <p><strong>Стартовый капитал:</strong> ${money(city.startMoney)}</p>
  `);
}

function showJobs(root, city) {
  setPanel(root, `
    <h2>Работы города</h2>
    <h3>${city.name}: ${city.jobs.length} варианта заработка</h3>
    <div class="home-jobs">
      ${renderJobs(city)}
    </div>
  `);
}

function showJob(root, city, job) {
  setPanel(root, `
    <h2>Работа</h2>
    <h3>${job.title}</h3>
    <p><strong>${money(job.pay)} за смену</strong></p>
    <p>${job.description}</p>
    <p>Бонус города: ${city.specialty.value}</p>
  `);
}

function showHousing(root, city) {
  setPanel(root, `
    <h2>Недвижимость</h2>
    <h3>${city.housing.title}</h3>
    <p><strong>От ${money(city.housing.minPrice)}</strong></p>
    <p>${city.housing.description}</p>
    <p>${city.housing.bonus}</p>
  `);
}

function showSettings(root, city) {
  setPanel(root, `
    <h2>Настройки</h2>
    <h3>${city.name}</h3>
    <p>Папка города: src/cities/${city.id}/index.js</p>
    <p>Тип экономики: ${city.economyType}</p>
  `);
}

function resetProgress() {
  localStorage.removeItem('mn-game-state');
  state.nickname = null;
  state.city = null;
  state.cityName = null;
  state.regionId = null;
  show('welcome1');
}
