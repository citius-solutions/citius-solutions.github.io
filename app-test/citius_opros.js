/* Ситиус · быстрый опрос-заявка.
   Самостоятельный модуль: страница (CitiusOpros.mount) и модалка в Аппе (CitiusOpros.open).
   Адрес сервера — та же глобальная LEADS_URL, что в leads_client.js.
   Пока URL пустой, успех не показывается: честный запасной блок со ссылками. */
(function (root) {
  'use strict';

  var TEL = '+79215725085';
  var TELH = '+7 921 572-50-85';
  var TG = 'https://t.me/citiusrealty';
  var MAX = 'https://max.ru/channel_citiusrealty';
  var MAIL = 'citius.solutions@yandex.ru';
  var PRIVACY = '/app-test/privacy.html';

  var OBJ = ['Квартира', 'Комната', 'Дом', 'Дача', 'Доля'];
  var CITY = ['Санкт-Петербург', 'Ленинградская область', 'Москва', 'Другой город'];
  var WHEN = ['Срочно', 'В течение 1–3 месяцев', 'Пока присматриваюсь'];

  var TOPICS = [
    { id: 'sell', label: 'Продать', qs: [
      { id: 'obj', text: 'Какой объект хотите продать', opts: OBJ, other: true },
      { id: 'city', text: 'Где находится объект', opts: CITY, city: true }
    ]},
    { id: 'buy', label: 'Купить', qs: [
      { id: 'obj', text: 'Какой объект хотите купить', opts: OBJ, other: true },
      { id: 'term', text: 'Когда планируете покупку', opts: WHEN }
    ]},
    { id: 'exchange', label: 'Обменять', qs: [
      { id: 'obj', text: 'Какой объект хотите обменять', opts: OBJ, other: true },
      { id: 'city', text: 'Где находится ваш объект', opts: CITY, city: true }
    ]},
    { id: 'commune', label: 'Расселить коммуналку', qs: [
      { id: 'city', text: 'Где находится коммуналка', opts: CITY, city: true },
      { id: 'term', text: 'Когда хотите начать', opts: WHEN }
    ]},
    { id: 'mortgage', label: 'Ипотека', qs: [
      { id: 'need', text: 'С чем нужна помощь', opts: ['Получить ипотеку', 'Рефинансировать', 'Согласовать продажу с банком', 'Другое'], other: true },
      { id: 'city', text: 'Где находится жильё', opts: CITY, city: true }
    ]},
    { id: 'tax', label: 'Налоги и вычеты', qs: [
      { id: 'need', text: 'С чем нужна помощь', opts: ['Налог при продаже', 'Налог при покупке', 'Вычет', 'Другое'], other: true },
      { id: 'term', text: 'Когда нужна консультация', opts: ['Срочно', 'В течение 1–3 месяцев', 'Пока разбираюсь'] }
    ]},
    { id: 'legal', label: 'Юридическая проверка', qs: [
      { id: 'obj', text: 'Что нужно проверить', opts: OBJ.concat(['Документы сделки']), other: true },
      { id: 'city', text: 'Где находится объект', opts: CITY, city: true }
    ]},
    { id: 'other', label: 'Другое', qs: [
      { id: 'free', text: 'Опишите, с чем хотите обратиться', free: true, required: true },
      { id: 'city', text: 'Где рассматривается вопрос', opts: CITY, city: true }
    ]}
  ];

  var TIMES = [
    { id: 'now', label: 'Сейчас' },
    { id: 'today-morning', label: 'Сегодня утром' },
    { id: 'today-day', label: 'Сегодня днём' },
    { id: 'today-evening', label: 'Сегодня вечером' },
    { id: 'tomorrow', label: 'Завтра' },
    { id: 'custom', label: 'Указать своё' }
  ];

  var state = null;
  var host = null;
  var prevFocus = null;
  var privacyLive = null;

  function leadsUrl() {
    try { return typeof LEADS_URL === 'string' ? LEADS_URL.trim() : ''; } catch (e) { return ''; }
  }
  function topicById(id) { for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === id) return TOPICS[i]; return null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function qn(n) { return n + '. '; }

  function phDig(v) {
    var s = String(v || ''), d;
    if (/^\s*\+\s*7/.test(s)) d = s.replace(/^\s*\+\s*7/, '').replace(/\D/g, '');
    else {
      d = s.replace(/\D/g, '');
      if (d.length > 10 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    }
    return d.slice(0, 10);
  }
  function phFmt(d) {
    var s = '+7 ';
    if (!d) return s;
    s += '(' + d.slice(0, 3);
    if (d.length >= 3) s += ')';
    if (d.length > 3) s += ' ' + d.slice(3, 6);
    if (d.length > 6) s += '-' + d.slice(6, 8);
    if (d.length > 8) s += '-' + d.slice(8, 10);
    return s;
  }
  function phOk(v) { return phDig(v).length === 10; }
  function phE164(v) { return phOk(v) ? '+7' + phDig(v) : ''; }

  function utmFrom(loc) {
    var out = {};
    try {
      var sp = new URLSearchParams((loc || root.location).search || '');
      ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content'].forEach(function (k) {
        var v = (sp.get(k) || '').trim();
        if (v) out[k] = v.slice(0, 120);
      });
    } catch (e) {}
    return out;
  }

  function sourceLabel(lead) {
    var src = lead.source === 'app' ? 'Апп' : 'ссылка';
    if (lead.utm_source) src += ' · utm_source=' + lead.utm_source;
    if (lead.utm_campaign) src += ' · utm_campaign=' + lead.utm_campaign;
    if (lead.utm_medium) src += ' · utm_medium=' + lead.utm_medium;
    return src;
  }

  function answerPairs(data) {
    var t = topicById(data.topicId);
    var rows = [];
    if (!t) return rows;
    t.qs.forEach(function (q) {
      var v = (data.answers[q.id] || '').trim();
      var extra = '';
      if (q.city && v === 'Другой город') extra = (data.cityOther || '').trim();
      if (q.other && v === 'Другое') extra = (data['other_' + q.id] || '').trim();
      if (!v && !extra) return;
      var val = extra && v ? v + ' (' + extra + ')' : (extra || v);
      rows.push([q.text, val]);
    });
    return rows;
  }

  function timeLabel(data) {
    if (data.whenId === 'custom') return (data.whenCustom || '').trim() || 'своё время не указано';
    for (var i = 0; i < TIMES.length; i++) if (TIMES[i].id === data.whenId) return TIMES[i].label;
    return '';
  }

  function nowMsk() {
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date()).replace(',', '') + ' МСК';
    } catch (e) { return new Date().toISOString(); }
  }

  function buildLead(data, opts) {
    opts = opts || {};
    var t = topicById(data.topicId);
    var utm = opts.utm || {};
    var topic = t ? t.label : '';
    var answers = answerPairs(data);
    var comment = (data.comment || '').trim();
    var lead = {
      kind: 'ОПРОС',
      svc: 'ОПРОС',
      source: opts.source || 'link',
      topic: topic,
      ctx: topic,
      name: (data.name || '').trim(),
      phone: phE164(data.phone),
      when: timeLabel(data),
      answers: answers,
      comment: comment,
      sentAt: new Date().toISOString(),
      app: 'app-test'
    };
    if (utm.utm_source) lead.utm_source = utm.utm_source;
    if (utm.utm_campaign) lead.utm_campaign = utm.utm_campaign;
    if (utm.utm_medium) lead.utm_medium = utm.utm_medium;
    if (utm.utm_content) lead.utm_content = utm.utm_content;
    if (opts.page) lead.page = opts.page;
    if (data.hp) lead.hp = data.hp;
    /* summary/ctx/svc/when — поля текущего formatLead_ в Code.gs v2, без обязательного передеплоя */
    var sum = [['Источник', sourceLabel(lead)]];
    answers.forEach(function (r) { sum.push(r); });
    if (comment) sum.push(['Комментарий', comment]);
    sum.push(['Дата и время', nowMsk()]);
    lead.summary = sum;
    return lead;
  }

  function formatMessage(lead, id) {
    /* Тот же вид, что formatLead_ в уже задеплоенном Code.gs v2 (kind «ОПРОС»). */
    var L = ['🔔 ОПРОС' + (id ? ' · №' + id : '')];
    L.push('Услуга: ОПРОС');
    if (lead.name) L.push('Имя: ' + lead.name);
    if (lead.phone) L.push('Телефон: ' + String(lead.phone).replace(/\s+/g, ''));
    if (lead.when) L.push('Когда звонить: ' + lead.when);
    if (lead.topic || lead.ctx) L.push('Тема: ' + (lead.topic || lead.ctx));
    var rows = lead.summary && lead.summary.length ? lead.summary : [];
    if (!rows.length) {
      rows = [['Источник', sourceLabel(lead)]];
      (lead.answers || []).forEach(function (r) { rows.push(r); });
      if (lead.comment) rows.push(['Комментарий', lead.comment]);
      rows.push(['Дата и время', nowMsk()]);
    }
    L.push('', 'Что указал в Аппе:');
    rows.forEach(function (r) { L.push('• ' + r[0] + ': ' + r[1]); });
    if (lead.page) L.push('', 'Экран: ' + lead.page);
    return L.join('\n');
  }

  function contactLinksHtml() {
    return '<div class="opros-actions">' +
      '<a class="opros-btn opros-btn--primary" href="tel:' + TEL + '">Позвонить · ' + TELH + '</a>' +
      '<a class="opros-btn opros-btn--ghost" href="' + TG + '" target="_blank" rel="noopener">Написать в Telegram</a>' +
      '<a class="opros-btn opros-btn--ghost" href="' + MAX + '" target="_blank" rel="noopener">Написать в MAX</a>' +
      '</div>';
  }

  var DRAFT_K = 'sitius-opros-draft';

  function emptyData() {
    return { step: 1, topicId: '', answers: {}, cityOther: '', comment: '', name: '', phone: '', whenId: '', whenCustom: '', consent: false, hp: '', err: '', commentOffer: null };
  }

  function snapshotForAuto(s) {
    s = s || state;
    if (!s) return { topicId: '', answers: {}, cityOther: '' };
    var o = { topicId: s.topicId || '', answers: Object.assign({}, s.answers || {}), cityOther: s.cityOther || '' };
    Object.keys(s).forEach(function (k) {
      if (/^other_/.test(k)) o[k] = s[k];
    });
    return o;
  }

  function autoComment(s) {
    s = s || state;
    if (!s || !s.topicId || s.topicId === 'other') return '';
    var t = topicById(s.topicId);
    if (!t) return '';
    var parts = [t.label];
    (t.qs || []).forEach(function (q) {
      if (q.free) return;
      var v = ((s.answers && s.answers[q.id]) || '').trim();
      if (!v) return;
      if (q.city && /другой/i.test(v)) v = (s.cityOther || '').trim() || v;
      else if (q.other && (v === 'Другое' || /другое/i.test(v))) {
        var alt = (s['other_' + q.id] || '').trim();
        if (alt) v = alt;
      }
      parts.push(v);
    });
    return parts.join(', ') + '.';
  }

  function applyGeneratedComment(prev) {
    if (!state) return;
    var cur = String(state.comment || '').trim();
    var oldAuto = autoComment(prev);
    var newAuto = autoComment(state);
    state.commentOffer = null;
    if (!cur || (oldAuto && cur === oldAuto) || (prev && prev.auto && cur === prev.auto)) {
      state.comment = newAuto;
      return;
    }
    if (oldAuto && cur.indexOf(oldAuto) !== -1) {
      state.comment = cur.split(oldAuto).join(newAuto).replace(/\s{2,}/g, ' ').trim();
      return;
    }
    if (newAuto && cur !== newAuto) {
      var label = (topicById(state.topicId) || {}).label || '';
      state.commentOffer = { keep: cur, replace: newAuto, topic: label };
    }
  }

  function saveDraft() {
    try {
      if (!state || state.view === 'ok' || state.view === 'fail') return;
      var d = snapshotForAuto(state);
      d.comment = state.comment || '';
      d.name = state.name || '';
      d.phone = state.phone || '';
      d.whenId = state.whenId || '';
      d.whenCustom = state.whenCustom || '';
      d.consent = !!state.consent;
      d.auto = autoComment(state);
      d.step = state.step || 1;
      d.t = Date.now();
      localStorage.setItem(DRAFT_K, JSON.stringify(d));
    } catch (e) {}
  }

  function loadDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT_K) || 'null');
      return d && typeof d === 'object' ? d : null;
    } catch (e) { return null; }
  }

  function applyDraft(d) {
    if (!d || !state) return;
    state.topicId = d.topicId || '';
    state.answers = d.answers || {};
    state.cityOther = d.cityOther || '';
    state.name = d.name || '';
    state.phone = d.phone || '';
    state.whenId = d.whenId || '';
    state.whenCustom = d.whenCustom || '';
    state.consent = !!d.consent;
    if (d.step) state.step = d.step;
    Object.keys(d).forEach(function (k) {
      if (/^other_/.test(k)) state[k] = d[k];
    });
    var stored = String(d.comment || '').trim();
    var storedAuto = String(d.auto || '').trim();
    var nowAuto = autoComment(state);
    if (!stored || (storedAuto && stored === storedAuto)) state.comment = nowAuto;
    else if (storedAuto && stored.indexOf(storedAuto) !== -1) state.comment = stored.split(storedAuto).join(nowAuto).replace(/\s{2,}/g, ' ').trim();
    else state.comment = stored;
    state.commentOffer = null;
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_K); } catch (e) {}
  }

  function setChip(group, id, val) {
    if (!state) return;
    if (group === 'topic') {
      var prev = snapshotForAuto(state);
      prev.auto = autoComment(state);
      state.topicId = val;
      state.answers = {};
      state.cityOther = '';
      applyGeneratedComment(prev);
    } else if (group === 'when') {
      state.whenId = val;
    } else {
      var prevA = snapshotForAuto(state);
      prevA.auto = autoComment(state);
      state.answers[id] = val;
      var cur = String(state.comment || '').trim();
      var oldAuto = autoComment(prevA);
      if (!cur || cur === oldAuto) state.comment = autoComment(state);
      else if (oldAuto && cur.indexOf(oldAuto) !== -1) state.comment = cur.split(oldAuto).join(autoComment(state)).replace(/\s{2,}/g, ' ').trim();
    }
    state.err = '';
    saveDraft();
    render();
  }

  function valOf(el) { return el ? el.value : ''; }

  function readInputs() {
    if (!host) return;
    var n = host.querySelector('[data-f="name"]');
    var p = host.querySelector('[data-f="phone"]');
    var c = host.querySelector('[data-f="comment"]');
    var w = host.querySelector('[data-f="whenCustom"]');
    var city = host.querySelector('[data-f="cityOther"]');
    var hp = host.querySelector('[data-f="hp"]');
    var cons = host.querySelector('[data-f="consent"]');
    if (n) state.name = n.value;
    if (p) state.phone = p.value;
    if (c) state.comment = c.value;
    if (w) state.whenCustom = w.value;
    if (city) state.cityOther = city.value;
    if (hp) state.hp = hp.value;
    if (cons) state.consent = !!cons.checked;
    host.querySelectorAll('[data-f^="other_"]').forEach(function (el) {
      state[el.getAttribute('data-f')] = el.value;
    });
  }

  function maskPhone(ev) {
    var el = ev.target;
    var d = phDig(el.value);
    var was = el.getAttribute('data-d') || '';
    if (ev && /^delete/.test(ev.inputType || '') && d === was && d.length) d = d.slice(0, -1);
    el.setAttribute('data-d', d);
    el.value = phFmt(d);
    state.phone = d ? '+7' + d : '';
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
  }

  function chips(opts, group, id, cur) {
    return '<div class="opros-chips" role="group">' + opts.map(function (o) {
      var on = cur === o ? ' is-on' : '';
      var press = cur === o ? 'true' : 'false';
      return '<button type="button" class="opros-chip' + on + '" aria-pressed="' + press + '"' +
        ' data-group="' + esc(group) + '" data-qid="' + esc(id || '') + '" data-val="' + esc(o) + '">' + esc(o) + '</button>';
    }).join('') + '</div>';
  }

  function otherField(q) {
    if (!q.other || state.answers[q.id] !== 'Другое') return '';
    var key = 'other_' + q.id;
    return '<div class="opros-field"><label class="opros-lbl" for="opros-' + key + '">Уточните</label>' +
      '<input type="text" id="opros-' + key + '" data-f="' + key + '" maxlength="200" value="' + esc(state[key] || '') + '"></div>';
  }
  function cityField(q) {
    if (!q.city || state.answers[q.id] !== 'Другой город') return '';
    return '<div class="opros-field"><label class="opros-lbl" for="opros-cityOther">Название города</label>' +
      '<input type="text" id="opros-cityOther" data-f="cityOther" maxlength="80" value="' + esc(state.cityOther || '') + '"></div>';
  }

  function commentOfferHtml() {
    if (!state || !state.commentOffer || !state.commentOffer.replace) return '';
    var topic = state.commentOffer.topic || 'новой темы';
    return '<div class="opros-offer" role="status">В поле остался ваш текст с предыдущей темы. Заменить его текстом для темы «' + esc(topic) + '»?</div>' +
      '<div class="opros-offer-act">' +
      '<button type="button" class="opros-btn opros-btn--primary" data-act="offer-replace">Заменить</button>' +
      '<button type="button" class="opros-btn opros-btn--ghost" data-act="offer-keep">Оставить</button>' +
      '</div>';
  }

  function step1() {
    var n = 1;
    return '<div class="opros-card"><div class="opros-q" id="opros-q">' + qn(n) + 'С чем хотите обратиться</div>' +
      chips(TOPICS.map(function (t) { return t.label; }), 'topic', 'topic', (topicById(state.topicId) || {}).label || '') +
      '</div>';
  }

  function step2() {
    var t = topicById(state.topicId);
    if (!t) return step1();
    var html = '<div class="opros-card">';
    var n = 2;
    t.qs.forEach(function (q) {
      html += '<div class="opros-q">' + qn(n++) + esc(q.text) + '</div>';
      if (q.free) {
        html += '<textarea data-f="comment" id="opros-free" maxlength="800" placeholder="Коротко, своими словами">' + esc(state.comment || '') + '</textarea>';
        html += commentOfferHtml();
      } else {
        html += chips(q.opts, 'ans', q.id, state.answers[q.id] || '') + otherField(q) + cityField(q);
      }
    });
    if (state.topicId !== 'other') {
      html += '<div class="opros-q">' + qn(n) + 'Коротко опишите запрос <span class="opros-opt">необязательно</span></div>';
      html += '<textarea data-f="comment" maxlength="800" placeholder="Если хотите добавить детали">' + esc(state.comment || '') + '</textarea>';
      html += commentOfferHtml();
    }
    html += '</div>';
    return html;
  }

  function privacyLink() {
    if (privacyLive === true) {
      return ' Как обрабатываются данные — в <a href="' + PRIVACY + '" target="_blank" rel="noopener">политике</a>.';
    }
    return '';
  }

  function step3() {
    var n = 4; /* 1 тема + 2 уточнения; для «Другое» тоже 2 вопроса на шаге 2, комментарий обязателен там */
    var t = topicById(state.topicId);
    var extra = t && t.qs ? t.qs.length : 2;
    n = 1 + extra + (state.topicId === 'other' ? 0 : 1) + 1;
    var nameN = n, phoneN = n + 1, timeN = n + 2;
    return '<div class="opros-card">' +
      '<p class="opros-lead" style="margin-bottom:12px">Оставьте имя, телефон и удобное время звонка — сотрудник Ситиуса свяжется с вами.</p>' +
      '<div class="opros-q">' + qn(nameN) + 'Как к вам обращаться</div>' +
      '<input type="text" data-f="name" id="opros-name" autocomplete="name" maxlength="80" placeholder="Имя" value="' + esc(state.name || '') + '">' +
      '<div class="opros-q">' + qn(phoneN) + 'Телефон</div>' +
      '<input type="tel" inputmode="tel" autocomplete="tel" data-f="phone" id="opros-phone" placeholder="+7 (___) ___-__-__" value="' + esc(phFmt(phDig(state.phone))) + '" data-d="' + esc(phDig(state.phone)) + '">' +
      '<div class="opros-q">' + qn(timeN) + 'Удобное время звонка</div>' +
      chips(TIMES.map(function (x) { return x.label; }), 'when', 'when', (TIMES.filter(function (x) { return x.id === state.whenId; })[0] || {}).label || '') +
      (state.whenId === 'custom' ? '<div class="opros-field"><label class="opros-lbl" for="opros-whenCustom">Своё время</label><input type="text" id="opros-whenCustom" data-f="whenCustom" maxlength="80" placeholder="Например: завтра после 15:00" value="' + esc(state.whenCustom || '') + '"></div>' : '') +
      '<p class="opros-hint">Звоним ежедневно с 09:00 до 21:00 по московскому времени.</p>' +
      '<label class="opros-check' + (state.err && !state.consent ? ' is-bad' : '') + '"><input type="checkbox" data-f="consent"' + (state.consent ? ' checked' : '') + '><i></i><span>Даю согласие на обработку персональных данных (имя и телефон для обратного звонка).' + privacyLink() + '</span></label>' +
      '<input type="text" class="opros-hp" data-f="hp" tabindex="-1" autocomplete="off" aria-hidden="true" value="' + esc(state.hp || '') + '">' +
      '</div>';
  }

  function successCopy(when, id) {
    var w = String(when || '').trim();
    var t = (!w || /^сейчас$/i.test(w)) ? 'Мы скоро вам перезвоним.' : 'Мы скоро вам перезвоним · ' + w + '.';
    if (id) t += ' Номер заявки ' + id + '.';
    return t;
  }
  function showSuccessOverlay(when, id) {
    if (typeof sitiusSuccess !== 'function') return;
    var ov = sitiusSuccess({
      title: 'Заявка принята',
      text: successCopy(when, id),
      btn: state && state.mode === 'modal' ? 'Закрыть' : 'Хорошо',
      onClose: function () { if (state && state.mode === 'modal') close(); }
    });
    if (ov && ov.style) ov.style.zIndex = '100000';
  }
  function stepDone(kind, payload) {
    if (kind === 'ok') {
      var when = (payload && payload.when) || (state.lastLead && state.lastLead.when) || '';
      var id = payload && payload.id || '';
      return '<div class="opros-card" style="text-align:center"><p class="opros-ok" style="font-family:\'Playfair Display\',Georgia,serif;font-size:21px;margin-bottom:8px">Заявка принята</p><p class="opros-ok">' + esc(successCopy(when, id)) + '</p></div>';
    }
    var text = payload && payload.text || '';
    var why = payload && payload.why || 'Не получилось отправить заявку через интернет.';
    var mail = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Заявка из опроса Ситиус') + '&body=' + encodeURIComponent(text);
    return '<div class="opros-card"><div class="opros-err" role="alert">' + esc(why) + ' Позвоните или напишите — текст запроса можно отправить письмом, он уже подставлен.</div>' +
      contactLinksHtml() +
      (text ? '<div class="opros-actions" style="margin-top:8px"><a class="opros-btn opros-btn--ghost" href="' + mail + '">Отправить письмом</a></div><pre class="opros-copy" id="opros-copy">' + esc(text) + '</pre>' : '') +
      '</div>';
  }

  function nav(primary, primaryId, back) {
    var b = back ? '<button type="button" class="opros-btn opros-btn--ghost" data-act="back">Назад</button>' : '';
    var p = primary ? '<button type="button" class="opros-btn opros-btn--primary" data-act="' + primaryId + '"' + (state.busy ? ' disabled' : '') + '>' + esc(primary) + '</button>' : '';
    return '<div class="opros-nav">' + b + p + '</div>';
  }

  function progress() {
    var step = state.view === 'ok' || state.view === 'fail' ? 3 : state.step;
    var pct = Math.round((step / 3) * 100);
    var label = state.view === 'ok' ? 'Готово' : (state.view === 'fail' ? 'Шаг 3 из 3' : 'Шаг ' + state.step + ' из 3');
    return '<div class="opros-prog" aria-hidden="true"><span style="width:' + pct + '%"></span></div><div class="opros-stepn">' + label + '</div>';
  }

  function header() {
    var close = state.mode === 'modal' ? '<button type="button" class="opros-close" data-act="close" aria-label="Закрыть">×</button>' : '';
    return '<div class="opros-top"><div><p class="opros-brand">Ситиус недвижимость</p><h1 class="opros-title" id="opros-title">Быстрый вопрос сотруднику</h1></div>' + close + '</div>' +
      (state.step === 1 && state.view === 'form' ? '<p class="opros-lead">Ответьте на несколько коротких вопросов и оставьте контакт для звонка.</p>' : '');
  }

  function footer() {
    return '<div class="opros-foot">Ситиус Недвижимость · <a href="tel:' + TEL + '">' + TELH + '</a></div>';
  }

  function errBox() {
    return state.err ? '<div class="opros-err" role="alert" id="opros-err">' + esc(state.err) + '</div>' : '';
  }

  function body() {
    if (state.view === 'ok') return stepDone('ok', state.result) + nav('Закрыть', state.mode === 'modal' ? 'close' : 'reset');
    if (state.view === 'fail') return stepDone('fail', state.result) + nav('Изменить данные', 'back', false);
    if (state.step === 1) return step1() + errBox() + nav('Далее', 'next');
    if (state.step === 2) return step2() + errBox() + nav('Далее', 'next', true);
    return step3() + errBox() + nav(state.busy ? 'Отправляем…' : 'Отправить заявку', 'send', true);
  }

  function render() {
    if (!host) return;
    var focusId = null;
    var ae = host.contains(document.activeElement) ? document.activeElement : null;
    if (ae && ae.id) focusId = ae.id;
    var sel = ae && ae.selectionStart;
    host.innerHTML = '<div class="opros-shell">' + header() + progress() + body() + footer() + '</div>' +
      (state.mode === 'modal' ? '<div class="opros-backdrop" data-act="close" aria-hidden="true"></div>' : '');
    bind();
    if (focusId) {
      var el = host.querySelector('#' + CSS.escape(focusId));
      if (el) {
        el.focus({ preventScroll: true });
        try { if (typeof sel === 'number' && el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
      }
    } else if (state.mode === 'modal' && state.justOpened) {
      var t = host.querySelector('#opros-title');
      if (t) t.setAttribute('tabindex', '-1'), t.focus();
      state.justOpened = false;
    }
  }

  function bind() {
    host.querySelectorAll('.opros-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        readInputs();
        var g = btn.getAttribute('data-group');
        var id = btn.getAttribute('data-qid');
        var val = btn.getAttribute('data-val');
        if (g === 'topic') {
          var t = TOPICS.filter(function (x) { return x.label === val; })[0];
          setChip('topic', 'topic', t ? t.id : '');
        } else if (g === 'when') {
          var tm = TIMES.filter(function (x) { return x.label === val; })[0];
          state.whenId = tm ? tm.id : '';
          state.err = '';
          render();
        } else {
          setChip('ans', id, val);
        }
      });
    });
    host.querySelectorAll('input,textarea').forEach(function (el) {
      if (el.getAttribute('data-f') === 'phone') {
        el.addEventListener('input', maskPhone);
        el.addEventListener('focus', function () { if (!el.value) el.value = '+7 '; });
      } else {
        el.addEventListener('input', function () { readInputs(); if (state.err) { state.err = ''; } saveDraft(); });
        el.addEventListener('change', function () { readInputs(); saveDraft(); });
      }
    });
    var cons = host.querySelector('[data-f="consent"]');
    if (cons) cons.addEventListener('change', function () { state.consent = cons.checked; });
    host.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        if (el.tagName === 'A') return;
        ev.preventDefault();
        var act = el.getAttribute('data-act');
        if (act === 'close') { close(); return; }
        if (act === 'back') { goBack(); return; }
        if (act === 'next') { goNext(); return; }
        if (act === 'send') { send(); return; }
        if (act === 'reset') { clearDraft(); state = Object.assign(emptyData(), { mode: state.mode, source: state.source, view: 'form' }); render(); return; }
        if (act === 'offer-replace' && state.commentOffer) { state.comment = state.commentOffer.replace || ''; state.commentOffer = null; saveDraft(); render(); return; }
        if (act === 'offer-keep' && state.commentOffer) { state.commentOffer = null; saveDraft(); render(); return; }
      });
    });
  }

  function goBack() {
    readInputs();
    saveDraft();
    state.err = '';
    if (state.view === 'fail') { state.view = 'form'; state.step = 3; render(); return; }
    if (state.step > 1) { state.step -= 1; render(); }
  }

  function validStep1() {
    if (!state.topicId) return 'Выберите, с чем хотите обратиться.';
    return '';
  }
  function validStep2() {
    var t = topicById(state.topicId);
    if (!t) return 'Выберите, с чем хотите обратиться.';
    for (var i = 0; i < t.qs.length; i++) {
      var q = t.qs[i];
      if (q.free) {
        if (!(state.comment || '').trim()) return 'Опишите, с чем хотите обратиться.';
        continue;
      }
      var v = (state.answers[q.id] || '').trim();
      if (!v) return 'Ответьте на вопрос: «' + q.text + '».';
      if (q.other && v === 'Другое' && !(state['other_' + q.id] || '').trim()) return 'Уточните выбранный вариант «Другое».';
      if (q.city && v === 'Другой город' && !(state.cityOther || '').trim()) return 'Укажите город.';
    }
    return '';
  }
  function validStep3() {
    if (!(state.name || '').trim()) return 'Укажите имя.';
    if (!phOk(state.phone)) return 'Укажите телефон: 10 цифр после +7.';
    if (!state.whenId) return 'Выберите удобное время звонка.';
    if (state.whenId === 'custom' && !(state.whenCustom || '').trim()) return 'Укажите своё время звонка.';
    if (!state.consent) return 'Чтобы отправить, отметьте согласие на обработку персональных данных.';
    return '';
  }

  function goNext() {
    readInputs();
    saveDraft();
    var err = state.step === 1 ? validStep1() : validStep2();
    if (err) { state.err = err; render(); focusErr(); return; }
    state.err = '';
    state.step += 1;
    render();
  }

  function focusErr() {
    var e = host && host.querySelector('#opros-err, .opros-err, .opros-check.is-bad');
    if (e) try { e.scrollIntoView({ block: 'nearest' }); } catch (err) {}
  }

  function optsNow() {
    return {
      source: state.source || 'link',
      utm: utmFrom(root.location),
      page: (function () { try { return location.pathname + location.search; } catch (e) { return ''; } })()
    };
  }

  function sendLeadCompat(lead) {
    if (typeof sendLead === 'function') return sendLead(lead);
    var url = leadsUrl();
    var body = Object.assign({ sentAt: new Date().toISOString(), ua: (root.navigator && navigator.userAgent) || '', app: 'app-test' }, lead);
    if (!url) return Promise.resolve({ ok: false, err: 'no_url' });
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var tm = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow', signal: ctl && ctl.signal })
      .then(function (r) { return r.ok ? r.json() : { ok: false, err: 'http ' + r.status }; })
      .catch(function (e) { return { ok: false, err: String(e) }; })
      .then(function (res) { clearTimeout(tm); return res; });
  }

  function send() {
    readInputs();
    var err = validStep3();
    if (err) { state.err = err; render(); focusErr(); return; }
    var lead = buildLead(state, optsNow());
    var text = formatMessage(lead);
    state.lastLead = lead;
    state.lastText = text;
    if (typeof root !== 'undefined') root.__oprosLast = { lead: lead, text: text };
    if (state.hp) {
      /* honeypot: не отправляем сотруднику и не утверждаем доставку */
      state.view = 'fail';
      state.result = { why: 'Не получилось отправить заявку через интернет.', text: text };
      render();
      return;
    }
    if (!leadsUrl() && typeof sendLead !== 'function') {
      state.view = 'fail';
      state.result = { why: 'Сейчас заявку через интернет отправить нельзя: сервер ещё не подключен.', text: text };
      render();
      return;
    }
    state.busy = true; state.err = '';
    render();
    sendLeadCompat(lead).then(function (res) {
      state.busy = false;
      if (res && res.ok) {
        var when = (state.lastLead && state.lastLead.when) || timeLabel(state);
        state.view = 'ok';
        state.result = { id: res.id || '', when: when };
        clearDraft();
        render();
        showSuccessOverlay(when, res.id || '');
        return;
      } else {
        var why = (res && res.err === 'no_url')
          ? 'Сейчас заявку через интернет отправить нельзя: сервер ещё не подключен.'
          : 'Не получилось отправить заявку через интернет.';
        state.view = 'fail';
        state.result = { why: why, text: text };
      }
      render();
    });
  }

  function onKey(ev) {
    if (!host || state.mode !== 'modal') return;
    if (ev.key === 'Escape') { ev.preventDefault(); close(); return; }
    if (ev.key !== 'Tab') return;
    var list = host.querySelectorAll('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])');
    var vis = [];
    list.forEach(function (el) { if (!el.disabled && el.offsetParent !== null) vis.push(el); });
    if (!vis.length) return;
    var first = vis[0], last = vis[vis.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }

  function checkPrivacy() {
    if (privacyLive !== null) return Promise.resolve(privacyLive);
    /* политика на app-test пока черновик и может быть не выложена — ссылку показываем только если страница открывается */
    return fetch(PRIVACY, { method: 'GET', cache: 'no-store' }).then(function (r) {
      privacyLive = !!(r && r.ok);
      return privacyLive;
    }).catch(function () { privacyLive = false; return false; });
  }

  function mount(el, opts) {
    opts = opts || {};
    host = typeof el === 'string' ? document.querySelector(el) : el;
    if (!host) return;
    prevFocus = document.activeElement;
    state = Object.assign(emptyData(), {
      mode: opts.mode || 'page',
      source: opts.source || (opts.mode === 'modal' ? 'app' : 'link'),
      view: 'form',
      justOpened: opts.mode === 'modal'
    });
    try {
      var draft = loadDraft();
      if (draft) applyDraft(draft);
    } catch (e) {}
    host.className = 'opros opros--' + state.mode;
    if (state.mode === 'modal') {
      host.setAttribute('role', 'dialog');
      host.setAttribute('aria-modal', 'true');
      host.setAttribute('aria-labelledby', 'opros-title');
      document.addEventListener('keydown', onKey);
    }
    checkPrivacy().then(function () { if (host) render(); });
    render();
    return api;
  }

  function open(opts) {
    opts = opts || {};
    var wrap = document.getElementById('citius-opros-modal');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'citius-opros-modal';
      document.body.appendChild(wrap);
    }
    mount(wrap, { mode: 'modal', source: opts.source || 'app' });
    document.documentElement.style.overflow = 'hidden';
    return api;
  }

  function close() {
    if (!host) return;
    document.removeEventListener('keydown', onKey);
    document.documentElement.style.overflow = '';
    if (state && state.mode === 'modal') {
      if (host.parentNode) host.parentNode.removeChild(host);
    }
    host = null;
    state = null;
    if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) {}
  }

  var api = {
    mount: mount,
    open: open,
    close: close,
    buildLead: buildLead,
    formatMessage: formatMessage,
    phDig: phDig,
    phFmt: phFmt,
    phOk: phOk,
    phE164: phE164,
    topics: TOPICS,
    leadsUrl: leadsUrl,
    sourceLabel: sourceLabel,
    nowMsk: nowMsk
  };
  root.CitiusOpros = api;
})(typeof window !== 'undefined' ? window : globalThis);
