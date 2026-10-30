(() => {
  const $ = id => document.getElementById(id);

  // фото на весь екран: стрілки, клавіші, свайп
  const lb = $('lb');
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
})();
