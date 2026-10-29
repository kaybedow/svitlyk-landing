
(() => {
  const $ = id => document.getElementById(id);

  const LEAD_URL = ''; // порожньо = демо

  const PACKS = { 1: 449, 3: 1099, 5: 1690 };
  const PROMO = { pct: 10, minutes: 10, code: 'SVIT10' };

  const num = n => n.toLocaleString('uk-UA').replace(/\s/g, '\u00a0');
  const money = n => num(n) + '\u00a0грн';
  const pcs = n => `${n} шт`;

  // найдешевша комбінація наборів 5/3/1 рівно на n штук
  function bestPrice(n) {
    let best = null;
    for (let five = 0; five * 5 <= n; five++) {
      for (let three = 0; five * 5 + three * 3 <= n; three++) {
        const one = n - five * 5 - three * 3;
        const cost = five * PACKS[5] + three * PACKS[3] + one * PACKS[1];
        if (!best || cost < best.cost) best = { cost, five, three, one };
      }
    }
    return best;
  }

  function packLabel({ five, three, one }) {
    const parts = [];
    if (five) parts.push(five > 1 ? `${five} × набір 5 шт` : 'набір 5 шт');
    if (three) parts.push(three > 1 ? `${three} × набір 3 шт` : 'набір 3 шт');
    if (one) parts.push(`${one} шт окремо`);
    return parts.join(' + ');
  }

  let chosen = 3;

  const rooms = [
    { id: 'hall', name: 'Коридор', hint: '1–2 на прохід', n: 1 },
    { id: 'wardrobe', name: 'Шафа, гардероб', hint: 'по 1 на секцію', n: 1 },
    { id: 'kitchen', name: 'Кухня під шафками', hint: '1 на 30 см стільниці', n: 1 },
    { id: 'stairs', name: 'Сходи', hint: '1 на 3–4 сходинки', n: 0 },
    { id: 'bedroom', name: 'Біля ліжка', hint: 'щоб не будити інших', n: 0 },
    { id: 'storage', name: 'Комора, балкон', hint: 'де немає вимикача', n: 0 },
  ];

  const roomsBox = $('rooms');
  roomsBox.innerHTML = rooms.map(({ id, name, hint, n }) => `
    <div class="room" data-id="${id}">
      <div><b>${name}</b><span>${hint}</span></div>
      <div class="qty">
        <button type="button" data-d="-1" aria-label="Менше">−</button>
        <output>${n}</output>
        <button type="button" data-d="1" aria-label="Більше">+</button>
      </div>
    </div>`).join('') +
    '<p class="calc-note">Набори по 3 і 5 штук дешевші, найвигідніший комплект підбираємо самі.</p>';

  const roomsTotal = () => rooms.reduce((sum, r) => sum + r.n, 0);

  function renderCalc() {
    const total = roomsTotal();

    roomsBox.querySelectorAll('.room').forEach((el, i) => {
      const { n } = rooms[i];
      el.querySelector('output').textContent = n;
      el.classList.toggle('on', n > 0);
      const minus = el.querySelector('[data-d="-1"]');
      minus.disabled = n === 0 || total === 1;
      minus.title = total === 1 && n === 1 ? 'Хоча б 1 світильник' : '';
    });

    const p = bestPrice(total);
    const single = total * PACKS[1];
    const each = Math.round(p.cost / total);

    $('packText').innerHTML = `Вам треба <b>${pcs(total)}</b>: ${packLabel(p)}`;
    $('sum').innerHTML = `${num(p.cost)} <small>грн</small>`;
    $('save').textContent = single > p.cost
      ? `${each} грн/шт, економія ${money(single - p.cost)}`
      : `${each} грн/шт`;
    $('calcBtn').textContent = `Замовити ${pcs(total)}`;

    chosen = total;
    syncPacks(total, p);
    updatePrices();
  }

  function syncPacks(total, p) {
    const custom = $('packCustom');
    const ready = document.querySelector(`#packs label:not(#packCustom) input[value="${total}"]`);
    if (ready) {
      custom.hidden = true;
      ready.checked = true;
      return;
    }
    const input = custom.querySelector('input');
    input.value = total;
    input.checked = true;
    $('pcQty').textContent = pcs(total);
    $('pcPrice').innerHTML = `${money(p.cost)}<small>${Math.round(p.cost / total)} грн/шт</small>`;
    custom.hidden = false;
  }

  let calcUsed = false;
  roomsBox.addEventListener('click', e => {
    const btn = e.target.closest('button[data-d]');
    if (!btn) return;

    const d = Number(btn.dataset.d);
    if (d < 0 && roomsTotal() <= 1) return;

    const room = rooms.find(r => r.id === btn.closest('.room').dataset.id);
    room.n = Math.max(0, Math.min(9, room.n + d));
    renderCalc();

    if (!calcUsed) {
      track('calculator_used');
      calcUsed = true;
    }
  });

  $('packs').addEventListener('change', e => {
    chosen = Number(e.target.value);
    updatePrices();
  });

  const getCookie = name => {
    const m = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
    return m ? decodeURIComponent(m[1]) : null;
  };

  function promoEnd() {
    let v = getCookie('svitlyk_promo');
    if (!v) {
      try { v = localStorage.getItem('svitlyk_promo'); } catch (e) {}
    }
    return v ? Number(v) : 0;
  }

  function savePromo(t) {
    document.cookie = `svitlyk_promo=${t}; max-age=${30 * 86400}; path=/; SameSite=Lax`;
    try { localStorage.setItem('svitlyk_promo', String(t)); } catch (e) {}
  }

  function promoState() {
    const end = promoEnd();
    if (!end) return 'new';
    return Date.now() < end ? 'active' : 'ended';
  }

  function updatePrices() {
    const base = bestPrice(chosen).cost;
    const active = promoState() === 'active';
    const final = active ? Math.round(base * (100 - PROMO.pct) / 100) : base;

    $('mQty').textContent = pcs(chosen);
    $('mPrice').textContent = money(final);
    $('mOld').hidden = !active;
    $('mOld').textContent = money(base);
    $('stickyPrice').textContent = money(final);
    $('qtyField').value = chosen;
    $('promoField').value = active ? PROMO.code : '';
    return final;
  }

  let tick = null;
  let sent = false;

  function renderPromo() {
    const state = sent ? 'sent' : promoState();
    $('promoScratch').hidden = state !== 'new';
    $('promoActive').hidden = state !== 'active';
    $('promoEnded').hidden = state !== 'ended';
    updatePrices();

    clearInterval(tick);
    if (state !== 'active') return;

    const timer = $('timer');
    const update = () => {
      const left = Math.max(0, promoEnd() - Date.now());
      const m = String(Math.floor(left / 60000)).padStart(2, '0');
      const s = String(Math.floor(left % 60000 / 1000)).padStart(2, '0');
      timer.textContent = `${m}:${s}`;
      timer.classList.toggle('low', left < 60000);
      if (!left) {
        clearInterval(tick);
        renderPromo();
      }
    };
    update();
    tick = setInterval(update, 1000);
  }

  function activatePromo(method) {
    if (promoState() !== 'new') return;
    savePromo(Date.now() + PROMO.minutes * 60000);
    track('promo_activated', { method });
    $('scratchCanvas').style.opacity = '0';
    $('scratch').classList.add('won');
    setTimeout(renderPromo, 900);
  }

  $('revealBtn').addEventListener('click', () => activatePromo('button'));

  let scratchReady = false;
  function initScratch() {
    if (scratchReady) return;
    const canvas = $('scratchCanvas');
    const rect = $('scratch').getBoundingClientRect();
    if (!rect.width) return;
    scratchReady = true;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#221E30';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#B9B4C8';
    ctx.font = '700 15px Manrope, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Зітріть тут пальцем або мишкою', rect.width / 2, rect.height / 2 + 5);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 38;
    ctx.lineCap = 'round';

    let down = false, last = null, moves = 0;

    const pos = e => {
      const b = canvas.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const line = (a, b) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    const cleared = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const step = 64;
      let clear = 0;
      for (let i = 3; i < data.length; i += 4 * step) if (data[i] === 0) clear++;
      return clear / (data.length / (4 * step));
    };

    canvas.addEventListener('pointerdown', e => {
      down = true;
      last = pos(e);
      canvas.setPointerCapture(e.pointerId);
      line(last, last);
    });
    canvas.addEventListener('pointermove', e => {
      if (!down) return;
      const p = pos(e);
      line(last, p);
      last = p;
      if (++moves % 8 === 0 && cleared() > 0.45) {
        down = false;
        activatePromo('scratch');
      }
    });
    window.addEventListener('pointerup', () => { down = false; });
  }

  const modal = $('modal');

  function openModal(source) {
    if (modal.open) return;
    if (modal.showModal) modal.showModal();
    else modal.setAttribute('open', '');
    track('popup_open', { source, qty: chosen });
    renderPromo();
    if (promoState() === 'new') setTimeout(initScratch, 30);
  }

  function closeModal() {
    if (modal.close) modal.close();
    else modal.removeAttribute('open');
  }

  document.querySelectorAll('a[href="#order"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (link.id === 'orderBtn') {
        chosen = Number(document.querySelector('#packs input:checked').value);
      }
      openModal(link.id || 'cta');
    });
  });
  modal.querySelector('[data-close]').addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  const phone = $('phone');

  function digits(value) {
    let d = value.replace(/\D/g, '');
    if (d.startsWith('380')) d = d.slice(3);
    else if (d.startsWith('80')) d = d.slice(2);
    return d.replace(/^0+/, '').slice(0, 9);
  }

  function mask(d) {
    const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
    return ['+380', ...groups].join(' ');
  }

  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+380 '; });
  phone.addEventListener('input', () => { phone.value = mask(digits(phone.value)); });
  phone.addEventListener('blur', () => { if (!digits(phone.value).length) phone.value = ''; });

  const form = $('form');
  const nameInput = $('name');
  const formErr = $('formErr');

  function setErr(input, id, msg) {
    $(id).textContent = msg;
    input.classList.toggle('invalid', Boolean(msg));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function showThanks(data) {
    sent = true;
    track('lead', { value: data.total, currency: 'UAH', qty: chosen, promo: data.promo || null });
    $('fields').style.display = 'none';
    modal.querySelector('.m-head').hidden = true;
    $('thanksSum').textContent = `Замовлення: ${pcs(chosen)} на ${money(data.total)}`;
    ['promoScratch', 'promoActive', 'promoEnded'].forEach(id => { $(id).hidden = true; });
    clearInterval(tick);
    $('thanks').style.display = 'block';
  }

  $('againBtn').addEventListener('click', () => {
    sent = false;
    $('thanks').style.display = 'none';
    $('demoNote').hidden = true;
    $('fields').style.display = '';
    modal.querySelector('.m-head').hidden = false;
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = false;
    btn.textContent = 'Замовити з оплатою при отриманні';
    renderPromo();
    phone.focus();
    phone.select();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const nameOk = nameInput.value.trim().length >= 2;
    const phoneOk = digits(phone.value).length === 9;
    setErr(nameInput, 'nameErr', nameOk ? '' : 'Вкажіть ім’я');
    setErr(phone, 'phoneErr', phoneOk ? '' : 'Номер у форматі +380 XX XXX XX XX');
    if (!nameOk || !phoneOk) {
      (nameOk ? phone : nameInput).focus();
      return;
    }

    const data = {};
    new FormData(form).forEach((v, k) => { if (v) data[k] = v; });
    data.phone = '+380' + digits(phone.value);
    data.total = updatePrices();

    formErr.hidden = true;

    if (!LEAD_URL) {
      $('demoNote').hidden = false;
      showThanks(data);
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Надсилаємо…';
    try {
      const res = await fetch(LEAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.status);
      showThanks(data);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Замовити з оплатою при отриманні';
      formErr.textContent = 'Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте 0 800 000 000.';
      formErr.hidden = false;
    }
  });

  const video = document.querySelector('.how video');
  if (video && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.4 }).observe(video);
  }

  const sticky = $('sticky');
  let heroOn = true, orderOn = false;
  const updSticky = () => sticky.classList.toggle('show', !heroOn && !orderOn);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { heroOn = entry.isIntersecting; updSticky(); }, { threshold: 0.1 })
      .observe(document.querySelector('.hero'));
    new IntersectionObserver(([entry]) => { orderOn = entry.isIntersecting; updSticky(); }, { threshold: 0.05 })
      .observe($('order'));
  }

  const lb = $('lb');
  if (lb.showModal) {
    const lbImg = $('lbImg'), lbCap = $('lbCap'), lbCount = $('lbCount');
    let photos = [], cur = 0;

    const caption = img => {
      const cap = img.closest('figure')?.querySelector('figcaption');
      if (!cap) return img.alt;
      return cap.innerText.split('\n').map(s => s.trim()).filter(Boolean).join(': ');
    };

    const show = i => {
      cur = (i + photos.length) % photos.length;
      const img = photos[cur];
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = caption(img);
      lbCount.textContent = `${cur + 1} / ${photos.length}`;
    };

    document.addEventListener('click', e => {
      const img = e.target;
      if (img.tagName !== 'IMG' || !img.closest('.photo') || img.closest('#lb')) return;
      const demo = img.closest('.demo');
      photos = [...document.querySelectorAll('main .photo img')].filter(el => Boolean(el.closest('.demo')) === Boolean(demo));
      show(photos.indexOf(img));
      lb.showModal();
      track('photo_zoom', { photo: img.getAttribute('src') });
    });

    lb.querySelector('.lb-prev').addEventListener('click', () => show(cur - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(cur + 1));
    lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

    document.addEventListener('keydown', e => {
      if (!lb.open) return;
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });

    let touchX = null;
    lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  renderCalc();
})();
