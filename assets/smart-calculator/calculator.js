/* StartAI — розумний калькулятор вартості. Ціни: window.STARTAI_PRICES (assets/prices.js). */
(function () {
  'use strict';
  var root = document.getElementById('smartCalc');
  var P = window.STARTAI_PRICES;
  if (!root || !P) return;

  var BIZ = [
    { id: 'services', ic: '🤝', t: 'Послуги', d: 'майстри, сервіси, агенції', cpc: 12, check: 1500 },
    { id: 'shop', ic: '🛍️', t: 'Магазин / товари', d: 'продаж товарів, доставка', cpc: 9, check: 1200 },
    { id: 'food', ic: '🍽️', t: 'Кафе / доставка їжі', d: 'ресторан, кав\'ярня, кейтеринг', cpc: 7, check: 500 },
    { id: 'beauty', ic: '💆', t: 'Краса / медицина', d: 'салон, клініка, косметологія', cpc: 10, check: 900 },
    { id: 'law', ic: '⚖️', t: 'Юрист / консалтинг', d: 'адвокат, бухгалтер, консультант', cpc: 18, check: 3000 },
    { id: 'build', ic: '🏗️', t: 'Будівництво / ремонт', d: 'ремонт, монтаж, сонячні станції', cpc: 15, check: 15000 },
    { id: 'other', ic: '💡', t: 'Інше', d: 'розкажете деталі в брифі', cpc: 12, check: 1500 }
  ];
  var HAS = [
    { id: 'social', ic: '📱', t: 'Instagram або Facebook' },
    { id: 'site', ic: '🌐', t: 'Старий сайт', d: 'зробимо новий замість нього' },
    { id: 'maps', ic: '📍', t: 'Профіль на Google Картах' },
    { id: 'domain', ic: '🔗', t: 'Свій домен', d: 'наприклад, firma.com.ua' },
    { id: 'none', ic: '🌱', t: 'Нічого немає', d: 'стартуємо з нуля' }
  ];
  var GOALS = [
    { id: 'leads', ic: '📞', t: 'Заявки та дзвінки', d: 'щоб клієнти лишали контакти' },
    { id: 'sell', ic: '🛒', t: 'Продавати онлайн', d: 'каталог, кошик, замовлення' },
    { id: 'bot', ic: '🤖', t: 'Відповідати 24/7', d: 'бот відповідає, поки ви зайняті' },
    { id: 'maps', ic: '📍', t: 'Бути на Google Картах', d: 'щоб знаходили «поруч»' },
    { id: 'ads', ic: '🚀', t: 'Клієнти вже цього місяця', d: 'реклама в пошуку Google' }
  ];

  var SHORT = { base: 'Сайт-лендинг', bot: 'AI чат-бот 24/7', page: 'Додаткові сторінки', catalog: 'Каталог з кошиком', domain: 'Домен + SSL', google: 'Профіль Google Business', ads: 'Запуск Google Ads', adsMonthly: 'Ведення реклами', support: 'Підтримка та правки' };
  var s = { step: 0, biz: null, has: [], goals: [], pages: 0, ads: null, budget: 8000, check: null, adsMonthly: true, support: false, off: {}, name: '', phone: '', sent: false, sending: false, error: false };
  var STEPS = 3;

  function fmt(n) { return Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ') + ' грн'; }
  function has(arr, id) { return arr.indexOf(id) !== -1; }
  function biz() { for (var i = 0; i < BIZ.length; i++) if (BIZ[i].id === s.biz) return BIZ[i]; return BIZ[0]; }
  function wantsAds() { return has(s.goals, 'ads'); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* --- рекомендація --- */
  function items() {
    var list = [{ k: 'base', why: 'мобільна версія, заявки в Telegram — основа', fixed: true }];
    var botWhy = has(s.goals, 'bot') ? 'ви хочете відповідати 24/7' : (s.biz === 'food' || s.biz === 'beauty' || s.biz === 'law') ? 'у вашій сфері клієнти часто питають одне й те саме' : 'відповідає й збирає контакти вночі та у вихідні';
    list.push({ k: 'bot', why: botWhy, rec: true });
    if (s.biz === 'shop' || has(s.goals, 'sell')) list.push({ k: 'catalog', why: s.biz === 'shop' ? 'для магазину — каталог з кошиком' : 'ви хочете продавати онлайн', rec: true });
    if (s.pages > 0) list.push({ k: 'page', qty: s.pages, why: 'окремі сторінки під послуги краще знаходить Google', rec: true });
    list.push({ k: 'domain', why: has(s.has, 'domain') ? 'підключимо ваш домен і SSL' : 'власна адреса замість технічної (домен купується окремо)', rec: true });
    if ((has(s.goals, 'maps') || has(s.goals, 'ads')) && !has(s.has, 'maps')) list.push({ k: 'google', why: has(s.goals, 'maps') ? 'щоб знаходили на Картах «поруч»' : 'реклама з адресою на карті працює краще', rec: true });
    if (wantsAds()) {
      list.push({ k: 'ads', why: 'клієнти з пошуку Google з першого тижня', rec: true });
      list.push({ k: 'adsMonthly', why: 'щомісячна оптимізація, щоб заявки дешевшали', rec: s.adsMonthly, opt: true });
    }
    list.push({ k: 'support', why: 'правки, нові акції та ціни на сайті', rec: s.support, opt: true });
    list.forEach(function (it) { it.on = it.fixed ? true : (s.off[it.k] === undefined ? (it.opt ? it.rec : true) : !s.off[it.k]); });
    return list;
  }
  function totals(list) {
    var once = 0, monthly = 0;
    list.forEach(function (it) { if (!it.on) return; var p = P[it.k]; var sum = p.price * (it.qty || 1); if (p.kind === 'monthly') monthly += sum; else once += sum; });
    return { once: once, monthly: monthly };
  }
  function pkg(list) {
    var on = function (k) { return list.some(function (i) { return i.k === k && i.on; }); };
    if (on('ads')) return 'ПАКЕТ БІЗНЕС';
    if (on('google') || on('catalog')) return 'ПАКЕТ СТАНДАРТ';
    return 'ПАКЕТ ЕКОНОМ';
  }
  function timeline(list) {
    var on = function (k) { return list.some(function (i) { return i.k === k && i.on; }); };
    var days = 1 + (on('catalog') ? 2 : 0) + (on('page') ? Math.ceil(s.pages / 3) : 0);
    var t = ['Сайт' + (on('bot') ? ' і бот' : '') + ' — ' + days + ' ' + (days === 1 ? 'день' : days < 5 ? 'дні' : 'днів')];
    if (on('google')) t.push('Google підтверджує профіль до 5 днів');
    if (on('ads')) t.push('реклама стартує через 1–2 дні після модерації');
    return t.join(' · ');
  }
  function code(list) {
    var c = [];
    list.forEach(function (it) { if (!it.on) return; var m = { base: 'b', bot: 'bot', catalog: 'catalog', domain: 'domain', google: 'google', ads: 'ads', adsMonthly: 'm', support: 'sup' }; if (it.k === 'page') c.push('p' + it.qty); else c.push(m[it.k]); });
    var q = 'calc=' + c.join(',');
    if (s.biz) q += '&biz=' + s.biz;
    if (s.goals.length) q += '&goals=' + s.goals.join(',');
    if (wantsAds()) q += '&adbudget=' + s.budget;
    return 'client-brief.html?' + q;
  }
  function forecast() {
    var b = biz(), check = s.check || b.check;
    var clicks = s.budget / b.cpc, lo = Math.round(clicks * 0.04), hi = Math.round(clicks * 0.08);
    var sales = Math.max(1, Math.round((lo + hi) / 2 * 0.3));
    return '<strong>Орієнтовно на ' + fmt(s.budget) + '/міс:</strong> ' + Math.round(clicks * 0.8) + '–' + Math.round(clicks * 1.2) + ' переходів, <strong>' + lo + '–' + hi + ' заявок</strong>. Якщо купує кожен третій — це ~' + sales + ' продажів, тобто ~' + fmt(sales * check) + ' виручки.<small>Оцінка за середніми цінами кліку в Чернігові для вашої сфери. Не гарантія — точніше скажемо після першого тижня реклами.</small>';
  }

  /* --- кроки --- */
  function chips(list, sel, multi, name) {
    return '<div class="sc-grid" role="group" aria-label="' + name + '">' + list.map(function (o) {
      var on = multi ? has(sel, o.id) : sel === o.id;
      return '<button type="button" class="sc-chip" data-id="' + o.id + '" aria-pressed="' + on + '"><span class="ic" aria-hidden="true">' + o.ic + '</span><span>' + esc(o.t) + (o.d ? '<small>' + esc(o.d) + '</small>' : '') + '</span></button>';
    }).join('') + '</div>';
  }
  function stepHtml() {
    switch (s.step) {
      case 0: return head('Крок 1 з 3', 'Який у вас бізнес?', 'Від цього залежить, що саме порадимо.') + chips(BIZ, s.biz, false, 'Тип бізнесу');
      case 1: return head('Крок 2 з 3', 'Що у вас уже є?', 'Можна обрати кілька. Не будемо продавати те, що вже працює.') + chips(HAS, s.has, true, 'Що вже є');
      case 2: return head('Крок 3 з 3', 'Що для вас головне?', 'Оберіть усе, що важливо, — калькулятор підбере інструменти.') + chips(GOALS, s.goals, true, 'Цілі') + contacts();
      case 3: return head('Крок 4 з 5', 'Деталі сайту', 'Головна сторінка вже входить у базу.') +
        '<div class="sc-row"><div><b>Окремі сторінки під послуги</b><small>Для кожної ключової послуги — своя сторінка: її краще знаходить Google.</small></div><div class="sc-stepper"><button type="button" class="sc-step-btn" data-pages="-1" aria-label="Менше сторінок">−</button><output aria-live="polite">' + s.pages + '</output><button type="button" class="sc-step-btn" data-pages="1" aria-label="Більше сторінок">+</button></div></div>' +
        '<div class="sc-row"><div><b>Підтримка після запуску</b><small>Правки, нові ціни й акції — без окремих рахунків. ' + fmt(P.support.price) + '/міс.</small></div>' + sw('support', s.support) + '</div>';
      case 4:
        var a = wantsAds();
        var h = head('Крок 5 з 5', 'Реклама в Google', 'Сайт без реклами — як вивіска в провулку. Можна стартувати й без неї.') +
          '<div class="sc-row"><div><b>Запустити рекламу в пошуку Google?</b><small>Налаштування, аналітика, конверсії та перший місяць ведення — ' + fmt(P.ads.price) + '.</small></div>' + sw('ads', a) + '</div>';
        if (a) {
          h += '<div class="sc-row" style="display:block"><label for="scBudget"><b>Рекламний бюджет: <span id="scBudgetVal">' + fmt(s.budget) + '</span>/міс</b><small>Оплачується напряму Google, окремо від нашої роботи.</small></label><input id="scBudget" class="sc-range" type="range" min="3000" max="30000" step="1000" value="' + s.budget + '"></div>' +
            '<div class="sc-row"><div><b>Середній чек</b><small>Скільки в середньому платить один клієнт.</small></div><input id="scCheck" class="sc-input" type="number" inputmode="numeric" min="100" step="100" value="' + (s.check || biz().check) + '" aria-label="Середній чек, грн"></div>' +
            '<div class="sc-row"><div><b>Вести рекламу далі</b><small>Щомісячна оптимізація — ' + fmt(P.adsMonthly.price) + '/міс.</small></div>' + sw('adsMonthly', s.adsMonthly) + '</div>' +
            '<div class="sc-forecast" id="scForecast" aria-live="polite">' + forecast() + '</div>';
        }
        return h;
    }
  }
  function head(l, q, h) { return '<p class="sc-step-label">' + l + '</p><h3 class="sc-q">' + q + '</h3><p class="sc-hint">' + h + '</p>'; }
  function sw(name, on) { return '<div class="sc-switch" role="group" aria-label="' + name + '"><button type="button" data-sw="' + name + '" data-v="1" aria-pressed="' + !!on + '">Так</button><button type="button" data-sw="' + name + '" data-v="0" aria-pressed="' + !on + '">Ні</button></div>'; }
  function phoneOk(p) { return String(p).replace(/\D/g, '').length >= 10; }
  function canNext() { return s.step === 0 ? !!s.biz : s.step === 2 ? (s.goals.length > 0 && s.name.trim().length > 1 && phoneOk(s.phone) && !s.sending) : true; }
  function contacts() {
    return '<div class="sc-contacts"><p class="sc-hint" style="margin:22px 0 12px">Куди надіслати розрахунок? Дмитро зателефонує й зафіксує ціну.</p><div class="sc-fields"><label class="sc-field"><span>Ім\'я</span><input id="scName" class="sc-input" autocomplete="name" value="' + esc(s.name) + '" placeholder="Ваше ім\'я"></label><label class="sc-field"><span>Телефон</span><input id="scPhone" class="sc-input" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(s.phone) + '" placeholder="+380"></label></div>' + (s.error ? '<p class="sc-err">Не вдалося надіслати. Напишіть нам у <a href="https://t.me/cryptomaus" target="_blank" rel="noopener">Telegram</a> — розрахунок збережено.</p>' : '') + '</div>';
  }

  /* --- рендер --- */
  root.className = 'sc';
  root.innerHTML = '<div class="sc-main"><div class="sc-progress" aria-hidden="true">' + Array(STEPS + 1).join('<span></span>') + '</div><div id="scStep"></div><div class="sc-live" aria-hidden="true">Зараз: <b id="scMOnce"></b> <span id="scMMonthly"></span></div><div class="sc-nav"><button type="button" class="sc-btn" id="scBack">← Назад</button><button type="button" class="sc-btn primary" id="scNext">Далі →</button></div></div>' +
    '<aside class="sc-side" aria-label="Ваш розрахунок"><span class="sc-pkg" id="scPkg">ПАКЕТ ЕКОНОМ</span><div class="sc-sub">Разово</div><div class="sc-total" id="scOnce" aria-live="polite">' + fmt(P.base.price) + '</div><div class="sc-sub" id="scMonthly"></div><ul class="sc-items" id="scItems"></ul><div class="sc-line"><span>Передоплата 50%</span><strong id="scAdv"></strong></div><div class="sc-line"><span>Після здачі</span><strong id="scRest"></strong></div><p class="sc-time" id="scTime"></p><p class="sc-sub" id="scSideHint">Відповідайте на 3 питання — розрахунок оновлюється одразу.</p></aside>' +
    '';

  var stepEl = root.querySelector('#scStep');
  function renderStep() {
    stepEl.innerHTML = stepHtml();
    var bars = root.querySelectorAll('.sc-progress span');
    for (var i = 0; i < bars.length; i++) bars[i].className = i <= s.step ? 'on' : '';
    root.querySelector('#scBack').style.visibility = s.step === 0 ? 'hidden' : 'visible';
    var next = root.querySelector('#scNext');
    next.disabled = !canNext();
    next.textContent = s.step === STEPS - 1 ? (s.sending ? 'Надсилаємо…' : 'Готово — отримати розрахунок ✓') : 'Далі →';
  }
  function renderSide() {
    var list = items(), t = totals(list);
    root.querySelector('#scPkg').textContent = pkg(list);
    root.querySelector('#scOnce').textContent = fmt(t.once);
    root.querySelector('#scMOnce').textContent = fmt(t.once);
    root.querySelector('#scMMonthly').textContent = t.monthly ? '+ ' + fmt(t.monthly) + '/міс' : '';
    root.querySelector('#scMonthly').textContent = t.monthly ? '+ щомісяця ' + fmt(t.monthly) : '';
    root.querySelector('#scAdv').textContent = fmt(t.once / 2);
    root.querySelector('#scRest').textContent = fmt(t.once - Math.round(t.once / 2));
    root.querySelector('#scTime').textContent = '⏱ ' + timeline(list);
    root.querySelector('#scItems').innerHTML = list.map(function (it) {
      var p = P[it.k], sum = p.price * (it.qty || 1), id = 'sci-' + it.k;
      var name = (SHORT[it.k] || p.name) + (it.k === 'page' ? ' × ' + it.qty : '');
      return '<li class="sc-item' + (it.on ? '' : ' off') + '"><input type="checkbox" id="' + id + '" data-item="' + it.k + '"' + (it.on ? ' checked' : '') + (it.fixed ? ' disabled' : '') + '><label for="' + id + '">' + esc(name) + '<span class="why">' + esc(it.why) + '</span></label><span class="pr">' + fmt(sum) + (p.kind === 'monthly' ? '/міс' : '') + '</span></li>';
    }).join('');
  }

  var BIZ_T = {}, GOAL_T = {}, HAS_T = {};
  BIZ.forEach(function (b) { BIZ_T[b.id] = b.t; }); GOALS.forEach(function (g) { GOAL_T[g.id] = g.t; }); HAS.forEach(function (h) { HAS_T[h.id] = h.t; });
  function leadText() {
    var list = items(), t = totals(list), lines = [];
    lines.push('🧮 *Заявка з калькулятора — StartAI*', '');
    lines.push('🏢 *Бізнес:* ' + (BIZ_T[s.biz] || '—'));
    lines.push('📦 *Вже є:* ' + (s.has.length ? s.has.map(function (h) { return HAS_T[h]; }).join(', ') : '—'));
    lines.push('🎯 *Цілі:* ' + s.goals.map(function (g) { return GOAL_T[g]; }).join(', '));
    lines.push('', '🧾 *' + pkg(list) + '*');
    list.forEach(function (it) { if (!it.on) return; var p = P[it.k]; lines.push('• ' + (SHORT[it.k] || p.name) + (it.k === 'page' ? ' × ' + it.qty : '') + ' — ' + fmt(p.price * (it.qty || 1)) + (p.kind === 'monthly' ? '/міс' : '')); });
    lines.push('', '💰 *Разово:* ' + fmt(t.once) + (t.monthly ? '\n🔁 *Щомісяця:* ' + fmt(t.monthly) : ''));
    lines.push('', '👤 *Ім\'я:* ' + s.name.trim().replace(/[*_`\[\]]/g, ''), '📞 *Телефон:* ' + s.phone.trim().replace(/[*_`\[\]]/g, ''));
    return lines.join('\n');
  }
  function send() {
    if (!canNext()) return;
    s.sending = true; s.error = false; renderStep();
    var p = typeof window.STARTAI_SEND_LEAD === 'function' ? window.STARTAI_SEND_LEAD(leadText()) : Promise.reject(new Error('no sender'));
    Promise.resolve(p).then(function () {
      s.sending = false; s.sent = true;
      try { if (window.ttq) window.ttq.track('SubmitForm'); } catch (e) {}
      try { if (window.gtag) window.gtag('event', 'generate_lead', { value: totals(items()).once, currency: 'UAH' }); } catch (e) {}
      done();
    }, function () { s.sending = false; s.error = true; renderStep(); });
  }
  function done() {
    var first = esc(s.name.trim().split(' ')[0] || '');
    root.querySelector('.sc-main').innerHTML = '<p class="sc-step-label">Готово</p><h3 class="sc-q">Дякуємо' + (first ? ', ' + first : '') + '!</h3><p class="sc-hint">Розрахунок уже в Дмитра. Він зателефонує найближчим часом, уточнить деталі й зафіксує ціну в договорі.</p><div class="sc-forecast"><strong>Що далі:</strong> дзвінок і уточнення → договір і передоплата 50% → запуск → решта 50% після здачі.</div><div class="sc-nav"><a class="sc-btn" href="https://t.me/cryptomaus" target="_blank" rel="noopener">Написати в Telegram</a></div>';
    root.querySelectorAll('.sc-item input').forEach(function (i) { i.disabled = true; });
    var h = root.querySelector('#scSideHint'); if (h) h.textContent = '✓ Розрахунок надіслано';
  }
  function render() { renderStep(); renderSide(); }

  root.addEventListener('click', function (e) {
    var chip = e.target.closest('.sc-chip');
    if (chip) {
      var id = chip.dataset.id;
      if (s.step === 0) s.biz = id;
      if (s.step === 1) { if (id === 'none') s.has = has(s.has, 'none') ? [] : ['none']; else { s.has = s.has.filter(function (x) { return x !== 'none'; }); s.has = has(s.has, id) ? s.has.filter(function (x) { return x !== id; }) : s.has.concat(id); } }
      if (s.step === 2) { s.goals = has(s.goals, id) ? s.goals.filter(function (x) { return x !== id; }) : s.goals.concat(id); s.ads = null; }
      s.off = {}; render(); chip = stepEl.querySelector('[data-id="' + id + '"]'); if (chip) chip.focus(); return;
    }
    var pg = e.target.closest('[data-pages]');
    if (pg) { s.pages = Math.max(0, Math.min(10, s.pages + Number(pg.dataset.pages))); delete s.off.page; render(); var b = stepEl.querySelector('[data-pages="' + pg.dataset.pages + '"]'); if (b) b.focus(); return; }
    var sv = e.target.closest('[data-sw]');
    if (sv) { var v = sv.dataset.v === '1', n = sv.dataset.sw; s[n] = v; delete s.off[n]; if (n === 'ads') delete s.off.adsMonthly; render(); var f = stepEl.querySelector('[data-sw="' + n + '"][data-v="' + sv.dataset.v + '"]'); if (f) f.focus(); return; }
    if (e.target.id === 'scNext') { if (s.step < STEPS - 1) { s.step++; render(); stepEl.querySelector('.sc-q').focus && stepEl.querySelector('.sc-q').setAttribute('tabindex', '-1'); stepEl.querySelector('.sc-q').focus(); } else { send(); } return; }
    if (e.target.id === 'scBack') { if (s.step > 0) { s.step--; render(); } return; }
  });
  root.addEventListener('change', function (e) {
    var k = e.target.dataset && e.target.dataset.item;
    if (k) { s.off[k] = !e.target.checked; if (k === 'adsMonthly') s.adsMonthly = e.target.checked; if (k === 'support') s.support = e.target.checked; renderSide(); if (s.step >= 3) renderStep(); var c = root.querySelector('[data-item="' + k + '"]'); if (c) c.focus(); }
  });
  root.addEventListener('input', function (e) {
    if (e.target.id === 'scName' || e.target.id === 'scPhone') { s[e.target.id === 'scName' ? 'name' : 'phone'] = e.target.value; s.error = false; var nb = root.querySelector('#scNext'); nb.disabled = !canNext(); return; }
    if (e.target.id === 'scBudget') { s.budget = Number(e.target.value); root.querySelector('#scBudgetVal').textContent = fmt(s.budget); root.querySelector('#scForecast').innerHTML = forecast(); renderSide(); }
    if (e.target.id === 'scCheck') { var v = Number(e.target.value); s.check = v > 0 ? v : null; root.querySelector('#scForecast').innerHTML = forecast(); }
  });
  root.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.target.id === 'scName' || e.target.id === 'scPhone')) { e.preventDefault(); if (canNext()) send(); } });
  render();
})();
