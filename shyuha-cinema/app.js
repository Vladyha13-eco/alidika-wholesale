const readyIds = new Set(Array.from({ length: 50 }, (_, index) => String(index + 1).padStart(2, '0')));
const featuredIds = new Set(['01', '02', '03', '04', '05', '08']);
const state = { products: [], attribution: null, pendingOrder: null };
const checkoutConfig = {
  vkUrl: 'https://vk.me/alidika1',
};

const attributionStorageKey = 'shyuha_attribution_v1';
const attributionKeys = ['ref', 'source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const fresh = Object.fromEntries(attributionKeys
    .map((key) => [key, params.get(key)])
    .filter(([, value]) => value));
  const now = Date.now();
  if (Object.keys(fresh).length) {
    const record = { ...fresh, captured_at: now };
    try { window.localStorage.setItem(attributionStorageKey, JSON.stringify(record)); } catch {}
    return record;
  }
  try {
    const stored = JSON.parse(window.localStorage.getItem(attributionStorageKey) || 'null');
    if (stored?.captured_at && now - stored.captured_at <= 30 * 24 * 60 * 60 * 1000) return stored;
    window.localStorage.removeItem(attributionStorageKey);
  } catch {}
  return null;
}

function attributionLines(record) {
  if (!record) return [];
  const source = record.utm_source || record.ref || record.source;
  const sourceLabel = source === 'alina' ? 'Алина' : source;
  return [
    sourceLabel ? `Источник: ${sourceLabel}` : null,
    record.utm_medium ? `Канал: ${record.utm_medium}` : null,
    record.utm_campaign ? `Кампания: ${record.utm_campaign}` : null,
    record.utm_content ? `Материал: ${record.utm_content}` : null,
  ].filter(Boolean);
}
const prices = { 'Футболка': 1500, 'Худи': 3000 };
const priceLabel = (garment) => `${prices[garment].toLocaleString('ru-RU')} ₽`;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function normalizeColor(value) {
  return value === 'white' || value === 'белый' ? 'white' : 'black';
}

function colorLabel(value) {
  return normalizeColor(value) === 'white' ? 'белый' : 'чёрный';
}

function assetFor(product, garment, view, color = 'black') {
  return `assets/${product.id}_${product.slug}_${garment}_${view}_${normalizeColor(color)}.webp`;
}

function renderReady(products) {
  $('#ready-grid').innerHTML = products.map((product) => `
    <article class="product" data-id="${product.id}" data-garment="tshirt" data-view="product" data-color="black">
      <div class="product-media">
        <img src="${assetFor(product, 'tshirt', 'product')}" alt="${escapeHtml(product.caption_ru)} — футболка, предметный вид">
        <span class="product-status">Визуализация</span>
      </div>
      <div class="product-body">
        <div class="product-number"><span>№ ${product.id}</span><span>${escapeHtml(product.reference)}</span></div>
        <h3>${escapeHtml(product.caption_latin)}</h3>
        <p class="reference">${escapeHtml(product.hook)}</p>
        <div class="switches" aria-label="Вид товара">
          <button class="active" type="button" data-set="garment" data-value="tshirt">Футболка</button>
          <button type="button" data-set="garment" data-value="hoodie">Худи</button>
          <button class="active" type="button" data-set="view" data-value="product">Вещь</button>
          <button type="button" data-set="view" data-value="outfit">Образ</button>
          <button class="active color-switch" type="button" data-set="color" data-value="black">Чёрный</button>
          <button class="color-switch" type="button" data-set="color" data-value="white">Белый</button>
        </div>
        <div class="product-bottom">
          <div class="product-summary"><strong class="product-price">1 500 ₽</strong><span class="palette">Идея палитры: ${escapeHtml(product.preferred_colors.join(' · '))}</span></div>
          <button class="pick" type="button" data-pick="${product.id}">Обсудить →</button>
        </div>
      </div>
    </article>`).join('');

  $$('.product').forEach((card) => {
    $('.switches', card).addEventListener('click', (event) => {
      const button = event.target.closest('button[data-set]');
      if (!button) return;
      const group = button.dataset.set;
      card.dataset[group] = button.dataset.value;
      $$(`[data-set="${group}"]`, card).forEach((item) => item.classList.toggle('active', item === button));
      const product = state.products.find((item) => item.id === card.dataset.id);
      const image = $('.product-media img', card);
      image.style.opacity = '.25';
      image.src = assetFor(product, card.dataset.garment, card.dataset.view, card.dataset.color);
      image.alt = `${product.caption_ru} — ${card.dataset.garment === 'tshirt' ? 'футболка' : 'худи'}, ${colorLabel(card.dataset.color)}, ${card.dataset.view === 'product' ? 'предметный вид' : 'образ'}`;
      image.onload = () => { image.style.opacity = '1'; };
      $('.product-price', card).textContent = priceLabel(card.dataset.garment === 'hoodie' ? 'Худи' : 'Футболка');
    });
  });
}

function renderIdeas(products) {
  $('#idea-grid').innerHTML = products.map((product) => {
    const files = ['tshirt_product', 'tshirt_outfit', 'hoodie_product', 'hoodie_outfit'];
    const labels = ['футболка', 'образ с футболкой', 'худи', 'образ с худи'];
    const previews = files.map((key, index) => `<img loading="lazy" data-asset="${key}" src="${assetFor(product, ...key.split('_'), 'black')}" alt="${escapeHtml(product.caption_ru)} — ${labels[index]}, чёрный">`).join('');
    return `<article class="idea ready" data-id="${product.id}" data-garment="tshirt" data-color="black">
      <div class="idea-previews">${previews}</div>
      <div class="idea-copy">
        <div class="idea-top"><span>№ ${product.id} · ${escapeHtml(product.reference)}</span><b>идея</b></div>
        <h3>${escapeHtml(product.caption_latin)}</h3>
        <p>${escapeHtml(product.hook)}</p>
        <strong class="idea-price">Футболка 1 500 ₽ · Худи 3 000 ₽</strong>
        <div class="switches idea-switches" aria-label="Вещь и цвет">
          <button class="active" type="button" data-set="garment" data-value="tshirt">Футболка</button>
          <button type="button" data-set="garment" data-value="hoodie">Худи</button>
          <button class="active color-switch" type="button" data-set="color" data-value="black">Чёрный</button>
          <button class="color-switch" type="button" data-set="color" data-value="white">Белый</button>
        </div>
        <button type="button" data-pick="${product.id}">Обсудить вариант →</button>
      </div>
    </article>`;
  }).join('');
}

function fillOrder(products) {
  $('#order-product').innerHTML = products.map((product) => `<option value="${product.id}">№${product.id} · ${escapeHtml(product.caption_latin)}</option>`).join('');
}

function updateOrderSummary() {
  const id = $('#order-product').value;
  const product = state.products.find((item) => item.id === id);
  const garmentLabel = $('#order-garment').value;
  const garment = garmentLabel === 'Худи' ? 'hoodie' : 'tshirt';
  if (!product) return;
  $('#order-price').textContent = priceLabel(garmentLabel);
  const color = normalizeColor($('#order-color').value);
  $('#order-preview').src = assetFor(product, garment, 'product', color);
  $('#order-preview').alt = `${product.caption_ru} — ${garmentLabel.toLowerCase()}, ${colorLabel(color)}`;
  $('#order-preview-caption').textContent = `№${id} · ${product.caption_latin}`;
  updateOrderDraft();
}

function updateSizeOptions(selected) {
  const sizes = ['Уточнить по замерам', '44', '46', '48', '50', '52', '54', '56'];
  $('#order-size').innerHTML = sizes.map((size) => `<option${size === selected ? ' selected' : ''}>${size}</option>`).join('');
  $('#size-note').textContent = 'Укажи свой размер. Наличие и посадку уточним в VK.';
}

function pickProduct(id, garment, color) {
  $('#order-product').value = id;
  $('#order-number').textContent = `#${id}`;
  $('#order-color').value = colorLabel(color);
  if (garment) {
    const garmentLabel = garment === 'hoodie' ? 'Худи' : 'Футболка';
    $('#order-garment').value = garmentLabel;
    updateSizeOptions($('#order-size').value);
  }
  updateOrderSummary();
  $('#order').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3400);
}

function buildOrder() {
  const product = state.products.find((item) => item.id === $('#order-product').value);
  const garment = $('#order-garment').value;
  return {
    product_id: product.id,
    product_name: product.caption_latin,
    garment,
    color: $('#order-color').value,
    size: $('#order-size').value,
    amount: prices[garment],
    currency: 'RUB',
    attribution: Object.fromEntries(attributionKeys
      .map((key) => [key, state.attribution?.[key]])
      .filter(([, value]) => value)),
  };
}

function preserveOrder(order) {
  state.pendingOrder = order;
  const url = new URL(window.location.href);
  url.searchParams.set('product', order.product_id);
  url.searchParams.set('garment', order.garment === 'Худи' ? 'hoodie' : 'tshirt');
  url.searchParams.set('color', order.color === 'белый' ? 'white' : 'black');
  url.searchParams.set('size', order.size);
  Object.entries(order.attribution).forEach(([key, value]) => url.searchParams.set(key, value));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function orderText(order) {
  return [
    'Привет! Хочу заказать вещь из КИНОДРОПА.',
    'ШЬЮХА · КИНОДРОП',
    `Принт: №${order.product_id} — ${order.product_name}`,
    `Вещь: ${order.garment}`,
    `Цвет: ${order.color}`,
    `Размер: ${order.size}`,
    `Цена на сайте: ${order.amount.toLocaleString('ru-RU')} ₽, без доставки`,
    'Подтвердите, пожалуйста, наличие, посадку, срок отправки, доставку и итоговую сумму. Оплату обсудим в диалоге.',
    ...attributionLines(order.attribution),
  ].join('\n');
}

function updateOrderDraft() {
  try {
    $('#order-draft').value = orderText(buildOrder());
  } catch {
    $('#order-draft').value = 'Введи 10 цифр после +7 или оставь телефон пустым — здесь появится готовая заявка.';
  }
}

function botOrderRef(order) {
  const garment = order.garment === 'Худи' ? 'h' : 't';
  const color = order.color === 'белый' ? 'w' : 'b';
  const size = /^\d{2}$/.test(order.size) ? order.size : 'ask';
  return `kd1.${order.product_id}.${garment}.${color}.${size}`;
}

function openOrderInVk() {
  const order = buildOrder();
  preserveOrder(order);
  const url = new URL(checkoutConfig.vkUrl);
  url.searchParams.set('ref', botOrderRef(order));
  url.searchParams.set('ref_source', 'kinodrop');
  window.location.assign(url.toString());
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const pick = event.target.closest('[data-pick]');
    if (pick) {
      const card = pick.closest('.product, .idea');
      pickProduct(pick.dataset.pick, card?.dataset.garment, card?.dataset.color);
    }
  });

  $$('.idea').forEach((card) => {
    $('.idea-switches', card).addEventListener('click', (event) => {
      const button = event.target.closest('button[data-set]');
      if (!button) return;
      const group = button.dataset.set;
      card.dataset[group] = button.dataset.value;
      $$(`[data-set="${group}"]`, card).forEach((item) => item.classList.toggle('active', item === button));
      if (group !== 'color') return;
      const product = state.products.find((item) => item.id === card.dataset.id);
      $$('img[data-asset]', card).forEach((image) => {
        const [garment, view] = image.dataset.asset.split('_');
        image.src = assetFor(product, garment, view, card.dataset.color);
        image.alt = `${product.caption_ru} — ${garment === 'tshirt' ? 'футболка' : 'худи'}, ${view === 'product' ? 'предметный вид' : 'образ'}, ${colorLabel(card.dataset.color)}`;
      });
    });
  });

  $('#order-product').addEventListener('change', (event) => {
    $('#order-number').textContent = `#${event.target.value}`;
    updateOrderSummary();
  });
  $('#order-garment').addEventListener('change', (event) => {
    updateSizeOptions($('#order-size').value);
    updateOrderSummary();
  });
  $('#order-color').addEventListener('change', updateOrderSummary);
  $('#order-size').addEventListener('change', updateOrderDraft);

  $('#order-form').addEventListener('submit', (event) => event.preventDefault());
  $('#order-copy-vk').addEventListener('click', openOrderInVk);
}

async function init() {
  try {
    state.attribution = captureAttribution();
    const response = await fetch('collection.json?v=20260830-bw');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const collection = await response.json();
    state.products = collection.products;
    const featured = state.products.filter((product) => featuredIds.has(product.id));
    renderReady(featured);
    renderIdeas(state.products);
    fillOrder(state.products);
    bindEvents();

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('product');
    if (requestedId && state.products.some((product) => product.id === requestedId)) {
      $('#order-product').value = requestedId;
      $('#order-number').textContent = `#${requestedId}`;
    }
    const requestedGarment = params.get('garment') === 'hoodie' ? 'Худи' : 'Футболка';
    $('#order-garment').value = requestedGarment;
    updateSizeOptions(params.get('size') || 'Уточнить по замерам');
    $('#order-color').value = colorLabel(params.get('color'));
    updateOrderSummary();

    if (window.location.hash) {
      const restoreAnchor = () => document.querySelector(window.location.hash)?.scrollIntoView();
      window.requestAnimationFrame(() => window.requestAnimationFrame(restoreAnchor));
      if (document.readyState === 'complete') restoreAnchor();
      else window.addEventListener('load', () => window.requestAnimationFrame(restoreAnchor), { once: true });
    }
  } catch (error) {
    $('#ready-grid').innerHTML = '<p>Не удалось загрузить коллекцию. Обнови страницу.</p>';
    console.error(error);
  }
}

init();
