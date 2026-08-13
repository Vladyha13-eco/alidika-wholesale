(() => {
  const KEY = 'alidika-wholesale-batch-v1';
  const LEAD_ENDPOINT = 'https://alidika-vk-proxy.eco-ra.chatgpt.site/api/site/lead';
  let batch = [];
  try { batch = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) {}

  const configurator = document.querySelector('#configurator');
  const configForm = document.querySelector('#config-form');
  const productName = document.querySelector('#product-name');
  const configTitle = document.querySelector('#config-title');
  const quantity = document.querySelector('#quantity');
  const itemNote = document.querySelector('#item-note');
  const itemFile = document.querySelector('#item-file');
  const fileLabel = document.querySelector('#file-label');
  const estimateBox = document.querySelector('#estimate-box');
  const estimateValue = document.querySelector('#estimate-value');
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
        <div><h3>${escapeHtml(item.product)}</h3><p>${item.quantity} шт. · ${escapeHtml(item.branding)}${item.estimate ? `<br>Ориентир: ${escapeHtml(item.estimate)}` : ''}${item.note ? `<br>${escapeHtml(item.note)}` : ''}${item.fileName ? `<br>Макет: ${escapeHtml(item.fileName)} — запросить при связи` : ''}</p></div>
        <button class="remove-item" type="button" data-remove="${index}" aria-label="Удалить ${escapeHtml(item.product)}">Удалить</button>
      </article>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  }

  function updateEstimate() {
    const price = Number(configForm.dataset.price || 0);
    const count = Math.max(1, Number(quantity.value || 1));
    estimateBox.hidden = false;
    if (!price) {
      estimateValue.textContent = 'Рассчитаем после уточнения';
      return '';
    }
    if (count < 100) {
      estimateValue.textContent = 'При тираже до 100 шт. — по расчёту';
      return '';
    }
    const estimate = `от ${formatMoney(price * count)}`;
    estimateValue.textContent = estimate;
    return estimate;
  }

  function openConfig(name, price = 0) {
    productName.value = name;
    configTitle.textContent = name;
    configForm.dataset.price = String(price);
    quantity.value = price ? 100 : 50;
    itemNote.value = '';
    itemFile.value = '';
    fileLabel.textContent = 'PNG, JPG, PDF или SVG · до 10 МБ';
    fileLabel.closest('.file-drop').classList.remove('has-file');
    configForm.querySelector('[value="Без нанесения"]').checked = true;
    updateEstimate();
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
    card.querySelector('.add-button').addEventListener('click', () => openConfig(card.dataset.product, Number(card.dataset.price || 0)));
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.product-card').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  }));
  document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
    openConfig(button.dataset.case, 0);
    itemNote.value = `Нужна помощь с подбором изделий для задачи: ${button.dataset.case}.`;
  }));
  document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeConfig));
  document.querySelectorAll('[data-open-batch]').forEach(btn => btn.addEventListener('click', openBatch));
  document.querySelectorAll('[data-close-batch]').forEach(btn => btn.addEventListener('click', closeBatch));
  document.querySelectorAll('[data-qty]').forEach(btn => btn.addEventListener('click', () => {
    quantity.value = Math.max(1, Number(quantity.value || 1) + Number(btn.dataset.qty));
    updateEstimate();
  }));
  quantity.addEventListener('input', updateEstimate);
  itemFile.addEventListener('change', () => {
    const file = itemFile.files[0];
    const drop = fileLabel.closest('.file-drop');
    if (!file) {
      fileLabel.textContent = 'PNG, JPG, PDF или SVG · до 10 МБ';
      drop.classList.remove('has-file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      itemFile.value = '';
      fileLabel.textContent = 'Файл больше 10 МБ — выберите другой';
      drop.classList.remove('has-file');
      showToast('Максимальный размер файла — 10 МБ');
      return;
    }
    fileLabel.textContent = file.name.slice(0, 120);
    drop.classList.add('has-file');
  });

  configForm.addEventListener('submit', event => {
    event.preventDefault();
    const file = itemFile.files[0];
    batch.push({
      product: productName.value,
      quantity: Math.max(1, Number(quantity.value)),
      branding: new FormData(configForm).get('branding'),
      note: itemNote.value.trim(),
      fileName: file ? file.name.slice(0, 120) : '',
      estimate: updateEstimate()
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

  function buildRequest() {
    const city = document.querySelector('#order-city').value.trim();
    const deadline = document.querySelector('#order-deadline').value.trim() || 'пока не определён';
    const contact = document.querySelector('#order-contact').value.trim() || 'не указано';
    const lines = batch.map((item, i) => `${i + 1}. ${item.product} — примерно ${item.quantity} шт.; ${item.branding.toLowerCase()}${item.estimate ? `; ориентир ${item.estimate}` : ''}${item.note ? `; важно: ${item.note}` : ''}${item.fileName ? `; есть макет «${item.fileName}», попросить прислать при связи` : ''}`);
    const message = `Здравствуйте! Хочу рассчитать оптовую партию АЛИДИКА.\n\n${lines.join('\n')}\n\nКуда отправлять: ${city}\nКогда нужна партия: ${deadline}\nКак обращаться: ${contact}\n\nПодскажите, пожалуйста, что ещё нужно уточнить для расчёта?`;
    return { city, deadline, contact, message };
  }

  function encodePayload(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  document.querySelectorAll('input[name="send-way"]').forEach(radio => radio.addEventListener('change', () => {
    const direct = document.querySelector('input[name="send-way"]:checked').value === 'direct';
    document.querySelector('#direct-send').hidden = !direct;
    document.querySelector('#social-send').hidden = direct;
    document.querySelector('#order-phone').required = direct;
    document.querySelector('#send-status').className = 'send-status';
    document.querySelector('#send-status').textContent = '';
  }));

  document.querySelectorAll('[data-social-link]').forEach(link => link.addEventListener('click', async () => {
    const { message } = buildRequest();
    try {
      await navigator.clipboard.writeText(message);
      showToast('Состав партии скопирован — вставьте его в сообщение');
    } catch (_) {
      window.prompt('Скопируйте заявку:', message);
    }
    localStorage.setItem('alidika-last-request', message);
  }));

  orderForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (document.querySelector('input[name="send-way"]:checked').value !== 'direct') return;
    const { city, deadline, contact, message } = buildRequest();
    const phone = document.querySelector('#order-phone').value.trim();
    const digits = phone.replace(/\D/g, '');
    const status = document.querySelector('#send-status');
    if (digits.length < 6 || digits.length > 15) {
      status.className = 'send-status error';
      status.textContent = 'Проверьте номер телефона: нам нужен номер, по которому можно с вами связаться.';
      document.querySelector('#order-phone').focus();
      return;
    }
    const submit = document.querySelector('#direct-submit');
    submit.disabled = true;
    submit.textContent = 'Отправляем…';
    status.className = 'send-status';
    status.textContent = '';
    try {
      const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          website: document.querySelector('#order-website').value,
          payload: encodePayload({phone, city, deadline, contact, items: batch})
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Не удалось отправить заявку.');
      localStorage.setItem('alidika-last-request', message);
      status.className = 'send-status success';
      status.textContent = 'Готово! Заявка уже у команды АЛИДИКИ в Telegram. Мы свяжемся с вами по указанному номеру.';
      batch = [];
      save();
      orderForm.reset();
    } catch (_) {
      status.className = 'send-status error';
      status.textContent = 'Сейчас заявка не отправилась. Попробуйте ещё раз или выберите «Напишу сам» — там доступны ВК и MAX.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Отправить заявку прямо с сайта';
    }
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
