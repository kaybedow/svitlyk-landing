// відео: сцени на першому екрані і ролик у блоці «Як працює»
(() => {
  const $ = id => document.getElementById(id);

  const video = document.querySelector('.how video');
  if (video) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.4 }).observe(video);
  }

  // перший екран: сцени на фоні йдуть по черзі по колу
  const hero = document.querySelector('.hero');
  const videos = [...hero.querySelectorAll('.hero-bg video')];

  const HOLD = 2500; // скільки тримаємо кадр зі світлом перед наступною сценою, мс
  const SPEED = 0.6; // ролики по 4,5 с, на звичайній швидкості світло вмикається занадто різко
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
  // без відео показуємо постер із увімкненим світлом
  const showLit = v => { v.poster = v.dataset.lit; };

  // наліпка зʼявляється, коли у відео вже горить світло
  const tag = $('litTag');
  const LIGHT_ON_AT = 1; // с
  const placeTag = v => {
    const [x, y] = (v.dataset.tag || '50% 20%').split(' ');
    tag.style.setProperty('--tx', x);
    tag.style.setProperty('--ty', y);
  };

  let current = 0;
  let timer = 0;

  function show(i) {
    clearTimeout(timer);
    current = i;
    videos.forEach((v, k) => v.classList.toggle('on', k === i));
    tag.classList.remove('show');
    placeTag(videos[i]);
    if (still) {
      tag.classList.add('show');
      return;
    }
    const v = videos[i];
    v.currentTime = 0;
    v.playbackRate = SPEED;
    v.play().catch(() => { showLit(v); tag.classList.add('show'); }); // наприклад, режим енергозбереження на iPhone
  }

  videos.forEach(v => {
    v.addEventListener('timeupdate', () => {
      if (v.classList.contains('on') && v.currentTime >= LIGHT_ON_AT) tag.classList.add('show');
    });
    v.addEventListener('ended', () => {
      timer = setTimeout(() => show((current + 1) % videos.length), HOLD);
    });
    v.querySelector('source:last-child')?.addEventListener('error', () => showLit(v));
  });

  if (still) {
    videos.forEach(showLit);
    show(videos.length - 1);
    return;
  }

  const start = () => {
    show(0);
    // решту сцен підвантажуємо, коли браузер вільний
    videos[0].addEventListener('playing', () => {
      const idle = window.requestIdleCallback || (cb => setTimeout(cb, 800));
      idle(() => videos.forEach(v => {
        if (v.classList.contains('on')) return;
        v.preload = 'auto';
        v.load();
      }));
    }, { once: true });
  };

  // стартуємо, коли перший екран видно, і ставимо на паузу, коли його прогорнули
  let started = false;
  new IntersectionObserver(([entry]) => {
    const v = videos[current];
    if (!entry.isIntersecting) {
      clearTimeout(timer);
      if (started) v.pause();
      return;
    }
    if (!started) {
      started = true;
      // відео стартує після завантаження сторінки, щоб не гальмувати першу відмальовку
      if (document.readyState === 'complete') start();
      else addEventListener('load', start, { once: true });
    } else if (v.ended) {
      show((current + 1) % videos.length);
    } else {
      v.play().catch(() => {});
    }
  }).observe(hero);
})();
