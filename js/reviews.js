// відгуки: по 2 на екрані, стрілки і крапки
(() => {
  const $ = id => document.getElementById(id);

  const rTrack = $('reviews');
  const rDots = $('rDots');
  if (rTrack) {
    const pages = () => Math.max(1, Math.round(rTrack.scrollWidth / rTrack.clientWidth));

    const renderDots = () => {
      const n = pages();
      const page = Math.round(rTrack.scrollLeft / rTrack.clientWidth);
      if (rDots.children.length !== n) {
        rDots.replaceChildren(...Array.from({ length: n }, (_, i) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.setAttribute('aria-label', `Сторінка ${i + 1}`);
          dot.addEventListener('click', () => rTrack.scrollTo({ left: i * rTrack.clientWidth }));
          return dot;
        }));
      }
      [...rDots.children].forEach((dot, i) => dot.classList.toggle('on', i === Math.min(page, n - 1)));
    };

    const go = dir => {
      const max = rTrack.scrollWidth - rTrack.clientWidth;
      let next = rTrack.scrollLeft + dir * rTrack.clientWidth;
      if (next > max + 5) next = 0;
      if (next < -5) next = max;
      rTrack.scrollTo({ left: next });
    };

    document.querySelector('.r-prev').addEventListener('click', () => go(-1));
    document.querySelector('.r-next').addEventListener('click', () => go(1));
    rTrack.addEventListener('scroll', () => requestAnimationFrame(renderDots), { passive: true });
    window.addEventListener('resize', renderDots);
    renderDots();
  }
})();
