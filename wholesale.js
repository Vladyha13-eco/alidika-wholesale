(() => {
  const KEY = 'alidika-wholesale-batch-v1';
  let batch = [];
  try { batch = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) {}

  const configurator = document.querySelector('#configurator');
  const configForm = document.querySelector('#config-form');
  const productName = document.querySelector('#product-name');
  const configTitle = document.querySelector('#config-title');
  const quantity = document.querySelector('#quantity');
  const itemNote = document.querySelector('#item-note');
  const drawer = document.querySelector('#batch');
  const batchItems = document.querySelector('#batch-items');
  const emptyBatch = document.querySelector('#empty-batch');
  const orderForm = document.querySelector('#order-form');
  const mobileBatch = document.querySelector('.mobile-batch');
  const toast = document.querySelector('#toast');

  function save() {
    localStorage.setItem(KEY, JSON.stringify(batch));
    render();
  }

  function wordForm(n) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'позиция';
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'позиции';
    return 'позиций';
  }

  function render() {
    document.querySelectorAll('[data-batch-count]').forEach(el => el.textContent = batch.length);
    document.querySelectorAll('[data-batch-label]').forEach(el => el.textContent = wordForm(batch.length));
    mobileBatch.classList.toggle('visible', batch.length > 0);
    mobileBatch.hidden = false;
    emptyBatch.hidden = batch.length > 0;
    orderForm.hidden = batch.length === 0;
    batchItems.innerHTML = batch.map((item, index) => `
      <article class="batch-item">
        <div><h3>${escapeHtml(item.product)}</h3><p>${item.quantity} шт. · ${escapeHtml(item.branding)}${item.note ? `<br>${escapeHtml(item.note)}` : ''}</p></div>
        <button class="remove-item" type="button" data-remove="${index}" aria-label="Удалить ${escapeHtml(item.product)}">Удалить</button>
      </article>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  function openConfig(name) {
    productName.value = name;
    configTitle.textContent = name;
    quantity.value = 50;
    itemNote.value = '';
    configForm.querySelector('[value="Без нанесения"]').checked = true;
    configurator.hidden = false;
    document.body.classList.add('locked');
    setTimeout(() => quantity.focus(), 20);
  }

  function closeConfig() {
    configurator.hidden = true;
    if (!drawer.classList.contains('open')) document.body.classList.remove('locked');
  }

  function openBatch() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');
    setTimeout(() => drawer.querySelector('.close-button').focus(), 20);
  }

  function closeBatch() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('locked');
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  document.querySelectorAll('.product-card').forEach(card => {
    card.querySelector('.add-button').addEventListener('click', () => openConfig(card.dataset.product));
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeConfig));
  document.querySelectorAll('[data-open-batch]').forEach(btn => btn.addEventListener('click', openBatch));
  document.querySelectorAll('[data-close-batch]').forEach(btn => btn.addEventListener('click', closeBatch));
  document.querySelectorAll('[data-qty]').forEach(btn => btn.addEventListener('click', () => {
    quantity.value = Math.max(1, Number(quantity.value || 1) + Number(btn.dataset.qty));
  }));

  configForm.addEventListener('submit', event => {
    event.preventDefault();
    batch.push({
      product: productName.value,
      quantity: Math.max(1, Number(quantity.value)),
      branding: new FormData(configForm).get('branding'),
      note: itemNote.value.trim()
    });
    save();
    closeConfig();
    showToast('Добавили в вашу партию');
    openBatch();
  });

  batchItems.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    batch.splice(Number(button.dataset.remove), 1);
    save();
  });

  document.querySelector('#clear-batch').addEventListener('click', () => {
    batch = [];
    save();
  });

  orderForm.addEventListener('submit', async event => {
    event.preventDefault();
    const city = document.querySelector('#order-city').value.trim();
    const deadline = document.querySelector('#order-deadline').value.trim() || 'пока не определён';
    const contact = document.querySelector('#order-contact').value.trim() || 'не указано';
    const lines = batch.map((item, i) => `${i + 1}. ${item.product} — примерно ${item.quantity} шт.; ${item.branding.toLowerCase()}${item.note ? `; важно: ${item.note}` : ''}`);
    const message = `Здравствуйте! Хочу рассчитать оптовую партию АЛИДИКА.\n\n${lines.join('\n')}\n\nКуда отправлять: ${city}\nКогда нужна партия: ${deadline}\nКак обращаться: ${contact}\n\nПодскажите, пожалуйста, что ещё нужно уточнить для расчёта?`;
    try {
      await navigator.clipboard.writeText(message);
      showToast('Заявка скопирована — вставьте её в сообщение');
    } catch (_) {
      window.prompt('Скопируйте заявку:', message);
    }
    localStorage.setItem('alidika-last-request', message);
    window.open('https://vk.me/alidika_izh', '_blank', 'noopener');
  });

  const lightbox = document.querySelector('#lightbox');
  document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    lightbox.querySelector('img').src = button.dataset.lightbox;
    lightbox.querySelector('img').alt = button.querySelector('img').alt;
    lightbox.hidden = false;
    document.body.classList.add('locked');
  }));
  lightbox.addEventListener('click', () => {
    lightbox.hidden = true;
    document.body.classList.remove('locked');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!configurator.hidden) closeConfig();
    if (drawer.classList.contains('open')) closeBatch();
    if (!lightbox.hidden) { lightbox.hidden = true; document.body.classList.remove('locked'); }
  });

  render();
})();
