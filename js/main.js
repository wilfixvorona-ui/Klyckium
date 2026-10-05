// Language: the Ukrainian page (ua/index.html) has <html lang="uk" data-base="../">
const LANG = document.documentElement.lang === 'uk' ? 'uk' : 'en';
const BASE = document.documentElement.dataset.base || '';

const I18N = {
  en: {
    numberLocale: 'en-US',
    play: 'Play video',
    cursorPlay: 'Play',
    cursorPause: 'Pause',
    cursorDrag: 'Drag',
    pause: 'Pause video',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    ago: (d) => (d < 7 ? `${d} d ago` : d < 30 ? `${Math.round(d / 7)} w ago` : `${Math.round(d / 30)} mo ago`),
    stars: (n) => `${n} out of 5 stars`,
    reviewFrom: (src) => `Review from ${src}`,
    page: (n) => `Page ${n}`,
  },
  uk: {
    numberLocale: 'uk-UA',
    play: 'Відтворити відео',
    cursorPlay: 'Дивитись',
    cursorPause: 'Пауза',
    cursorDrag: 'Тягни',
    pause: 'Поставити на паузу',
    openMenu: 'Відкрити меню',
    closeMenu: 'Закрити меню',
    ago: (d) => (d < 7 ? `${d} дн. тому` : d < 30 ? `${Math.round(d / 7)} тиж. тому` : `${Math.round(d / 30)} міс. тому`),
    stars: (n) => `${n} з 5 зірок`,
    reviewFrom: (src) => `Відгук з ${src}`,
    page: (n) => `Сторінка ${n}`,
  },
};
const t = (key, ...args) => {
  const value = I18N[LANG][key];
  return typeof value === 'function' ? value(...args) : value;
};

// Language links point to folders (./ and ua/); opened from disk they need index.html
if (location.protocol === 'file:') {
  document.querySelectorAll('a[hreflang]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.endsWith('/')) a.setAttribute('href', `${href}index.html`);
  });
}

// Sticky header: its height is shared with CSS (--header-h) and used for scroll offsets
const header = document.querySelector('.header');
const headerHeight = () => (header ? header.offsetHeight : 0);

if (header) {
  const syncHeader = () => document.documentElement.style.setProperty('--header-h', `${headerHeight()}px`);
  const syncShadow = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  syncHeader();
  syncShadow();
  window.addEventListener('resize', syncHeader);
  window.addEventListener('scroll', syncShadow, { passive: true });
}

// Reveal on scroll
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('is-visible'));
}

// Count-up numbers
const counters = document.querySelectorAll('[data-count]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const formatCount = (el, value) => {
  el.textContent = Math.round(value).toLocaleString(t('numberLocale')) + (el.dataset.suffix || '');
};

const runCounter = (el) => {
  const target = Number(el.dataset.count);
  const duration = 1800;
  const start = performance.now();

  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    formatCount(el, target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

if (!reduceMotion && 'IntersectionObserver' in window) {
  counters.forEach((el) => formatCount(el, 0));

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach((el) => counterObserver.observe(el));
}

// Video player: click to pause/play, progress bar with seeking
const player = document.getElementById('vplayer');

if (player) {
  const video = player.querySelector('.vplayer__video');
  const toggle = player.querySelector('.vplayer__toggle');
  const barBtn = player.querySelector('.vplayer__btn');
  const range = player.querySelector('.vplayer__range');
  const time = player.querySelector('.vplayer__time');

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const syncState = () => {
    const paused = video.paused;
    player.classList.toggle('is-paused', paused);
    const label = paused ? t('play') : t('pause');
    toggle.setAttribute('aria-label', label);
    barBtn.setAttribute('aria-label', label);
  };

  const togglePlay = () => (video.paused ? video.play() : video.pause());

  let seeking = false;
  const syncProgress = () => {
    if (!seeking && video.duration) {
      const p = video.currentTime / video.duration;
      range.value = Math.round(p * 1000);
      range.style.setProperty('--p', `${p * 100}%`);
      time.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    }
    requestAnimationFrame(syncProgress);
  };

  // clicks anywhere on the video toggle playback, except on the control bar
  player.addEventListener('click', (e) => {
    if (e.target.closest('.vplayer__bar')) return;
    togglePlay();
  });
  barBtn.addEventListener('click', togglePlay);

  range.addEventListener('input', () => {
    seeking = true;
    const p = range.value / 1000;
    range.style.setProperty('--p', `${p * 100}%`);
    if (video.duration) {
      video.currentTime = p * video.duration;
      time.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    }
  });
  range.addEventListener('change', () => { seeking = false; });

  video.addEventListener('play', syncState);
  video.addEventListener('pause', syncState);

  // overlay sizes are in em, 1em = 1% of the player width
  new ResizeObserver(([entry]) => {
    player.style.fontSize = `${entry.contentRect.width / 100}px`;
  }).observe(player);

  video.muted = true;
  video.play().catch(() => {});
  syncState();
  requestAnimationFrame(syncProgress);
}

// Flying video: the player moves and grows from the hero card into the about section while scrolling (all screen sizes)
const heroSlot = document.querySelector('.hero__video');
const aboutSlot = document.querySelector('.about__video');
const aboutSection = document.getElementById('about');
const heroCard = heroSlot && heroSlot.closest('.hero__card');

if (player && heroSlot && aboutSlot && aboutSection) {
  let fly = null;
  let frame = null;
  let last = '';
  let progress = null;
  const SMOOTHING = 0.1; // Lenis already smooths the wheel

  const lerp = (a, b, t) => a + (b - a) * t;

  const update = () => {
    const sy = window.scrollY;
    const a = heroSlot.getBoundingClientRect();
    const b = aboutSlot.getBoundingClientRect();

    // finished when the about section reaches the top of the viewport
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const end = Math.max(1, Math.min(aboutSection.getBoundingClientRect().top + sy, maxScroll));
    const target = Math.min(Math.max(sy / end, 0), 1);

    // inertia: progress eases towards the scroll position instead of jumping with it
    if (progress === null) progress = target;
    progress += (target - progress) * SMOOTHING;
    if (Math.abs(target - progress) < 0.0005) progress = target;

    const p = progress;
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

    const ra = parseFloat(getComputedStyle(heroSlot).borderTopLeftRadius);
    const rb = parseFloat(getComputedStyle(aboutSlot).borderTopLeftRadius);

    const x = lerp(a.left, b.left, e);
    const y = lerp(a.top, b.top, e) + sy;
    const w = lerp(a.width, b.width, e);
    const h = lerp(a.height, b.height, e);
    const opacity = p > 0 ? 1 : getComputedStyle(heroCard).opacity;

    const key = [x, y, w, h, opacity].map((n) => Math.round(n * 10)).join();
    if (key !== last) {
      last = key;
      fly.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      fly.style.width = `${w}px`;
      fly.style.height = `${h}px`;
      fly.style.borderRadius = `${lerp(ra, rb, e)}px`;
      fly.style.opacity = opacity;
    }

    // full controls only once the player is big enough
    player.classList.toggle('is-docked', p > 0.9);

    frame = requestAnimationFrame(update);
  };

  const enable = () => {
    if (fly) return;
    fly = document.createElement('div');
    fly.className = 'video-fly';
    fly.append(player);
    document.body.append(fly);
    document.documentElement.classList.add('has-fly');
    last = '';
    progress = null;
    frame = requestAnimationFrame(update);
  };

  const disable = () => {
    if (!fly) return;
    cancelAnimationFrame(frame);
    aboutSlot.append(player);
    fly.remove();
    fly = null;
    document.documentElement.classList.remove('has-fly');
    player.classList.add('is-docked');
  };

  // phones get the flight too: the mobile hero card has its own small preview slot
  const sync = () => (reduceMotion ? disable() : enable());
  player.classList.add('is-docked');
  sync();

  // moving the element in the DOM can pause it in some browsers — keep it playing
  if (!player.classList.contains('is-paused')) player.querySelector('video').play().catch(() => {});
}

// Services: section pins while vertical scroll moves the cards horizontally (all screen sizes)
const services = document.getElementById('services');

if (services) {
  const pin = services.querySelector('.services__pin');
  const doctorsSection = document.getElementById('doctors');
  const band = services.querySelector('.services__band');
  const track = services.querySelector('.services__track');
  const SMOOTHING = 0.14;
  let distance = 0;
  let pinTop = 0;
  let current = 0;
  let covered = 0;
  let frame = null;

  const measure = () => {
    distance = Math.max(0, track.scrollWidth - band.clientWidth);
    // centre the block in the space under the sticky header (tall phones leave room);
    // if it is taller than that space, pin it by its bottom edge so the cards stay visible
    const free = window.innerHeight - headerHeight() - pin.offsetHeight;
    pinTop = free >= 0 ? headerHeight() + free / 2 : window.innerHeight - pin.offsetHeight;
    pin.style.setProperty('--pin-top', `${pinTop}px`);
    // one extra screen of scroll at the end: the pin stays put while the doctors section slides over it
    const cover = doctorsSection ? window.innerHeight : 0;
    services.style.height = `${pin.offsetHeight + distance + cover + parseFloat(getComputedStyle(services).paddingTop)}px`;
    services.style.marginBottom = `${-cover}px`;
  };

  const update = () => {
    const pinStart = services.getBoundingClientRect().top + parseFloat(getComputedStyle(services).paddingTop);
    const target = Math.min(Math.max(pinTop - pinStart, 0), distance);

    current += (target - current) * SMOOTHING;
    if (Math.abs(target - current) < 0.5) current = target;
    track.style.transform = `translate3d(${-current}px, 0, 0)`;

    // pinned block sinks back slightly while the doctors section covers it (eased, not 1:1 with the wheel)
    if (doctorsSection) {
      const vh = window.innerHeight;
      const coverTarget = Math.min(Math.max((vh - doctorsSection.getBoundingClientRect().top) / vh, 0), 1);
      covered += (coverTarget - covered) * 0.08;
      if (Math.abs(coverTarget - covered) < 0.001) covered = coverTarget;
      const c = covered * covered * (3 - 2 * covered);
      pin.style.transform = c ? `scale(${1 - c * 0.06})` : '';
      pin.style.opacity = c ? String(1 - c * 0.5) : '';
    }

    frame = requestAnimationFrame(update);
  };

  const enable = () => {
    services.classList.add('is-pinned');
    measure();
    if (!frame) frame = requestAnimationFrame(update);
  };

  const disable = () => {
    cancelAnimationFrame(frame);
    frame = null;
    current = 0;
    track.style.transform = '';
    pin.style.transform = '';
    pin.style.opacity = '';
    services.style.height = '';
    services.style.marginBottom = '';
    services.classList.remove('is-pinned');
  };

  // phones get the same pinned sideways scroll as desktop
  const sync = () => (reduceMotion ? disable() : enable());
  window.addEventListener('resize', () => { if (frame) measure(); });
  window.addEventListener('load', sync);
  sync();
}

// Before / after slider
document.querySelectorAll('.ba').forEach((ba) => {
  const range = ba.querySelector('.ba__range');
  const set = () => ba.style.setProperty('--pos', `${range.value}%`);
  range.addEventListener('input', set);
  range.addEventListener('pointerdown', () => ba.classList.add('is-dragging'));
  window.addEventListener('pointerup', () => ba.classList.remove('is-dragging'));
  set();
});

// Reviews: sorting + pagination
const reviewsList = document.getElementById('reviews-list');

if (reviewsList) {
  const PER_PAGE = 4;
  const sortSelect = document.getElementById('reviews-sort');
  const pagesEl = document.getElementById('reviews-pages');
  const arrows = document.querySelectorAll('.pager__arrow');
  const reviewsSection = document.getElementById('reviews');

  // days: how long ago; source: 'facebook' | 'google' | null
  const REVIEWS = [
    { name: 'Roman Shevchuk', avatar: 'avatar-roman.png', days: 1, rating: 5, source: 'facebook', text: 'I avoided dentists for almost six years because of one bad experience. Dr. Melnyk explained every step of my root canal before he started and checked in with me constantly. It took about an hour and a half, and honestly the anesthesia injection was the worst part. I\'ve already booked my wife in.' },
    { name: 'Oleh Marchenko', days: 5, rating: 5, source: null, text: 'Cracked a crown on Saturday morning, got a same-day appointment and walked out with a new one before dinner. Didn\'t expect that on a weekend.' },
    { name: 'Nataliia Kravets', days: 14, rating: 4, source: 'google', text: 'My daughter\'s first visit went better than I hoped — she even asked when we\'re coming back. The only downside was waiting about 20 minutes past our appointment time. Friendly staff, but they could let you know about delays in advance.' },
    { name: 'Viktoriia Zaiets', avatar: 'avatar-viktoriia.png', days: 21, rating: 5, source: 'google', text: 'Clean, calm and on time. Dr. Savchuk found a small cavity I didn\'t even feel yet, fixed it in 20 minutes.' },
    { name: 'Andrii Lysenko', days: 24, rating: 5, source: 'google', text: 'Got my implant with Dr. Bondar. He showed me the 3D scan, explained where the post would go and how long healing takes. Six months later it feels like my own tooth.' },
    { name: 'Iryna Polishchuk', days: 27, rating: 5, source: 'facebook', text: 'Finally found a clinic where nobody rushes you. The cleaning was thorough and they gave me an honest plan instead of a list of things to sell.' },
    { name: 'Dmytro Hrytsenko', days: 33, rating: 4, source: null, text: 'Aligners from Dr. Hnatiuk are doing their job — my gap is almost closed after four months. Parking nearby is a pain, but the treatment itself is great.' },
    { name: 'Olena Moroz', days: 38, rating: 5, source: 'google', text: 'I came in with bleeding gums I had ignored for a year. Dr. Tkachenko was straight with me but never made me feel guilty. Two sessions and it\'s under control.' },
    { name: 'Serhii Bondarenko', days: 45, rating: 5, source: 'google', text: 'Booked online at 9, was in the chair by 11. The whole visit took 40 minutes, including a proper explanation of my X-ray.' },
    { name: 'Kateryna Shevchenko', days: 52, rating: 5, source: 'facebook', text: 'My son is terrified of doctors, and Dr. Koval turned his braces fitting into a game. He actually likes showing off his colourful bands now.' },
    { name: 'Maksym Romanenko', days: 60, rating: 4, source: 'google', text: 'Whitening worked better than I expected, a few shades lighter in one visit. Teeth were a bit sensitive for two days, which they did warn me about.' },
    { name: 'Yuliia Tkachuk', days: 68, rating: 5, source: null, text: 'Three crowns in one week and not a single surprise on the bill. They gave me the full price before starting and stuck to it.' },
    { name: 'Vasyl Kovalenko', days: 75, rating: 5, source: 'google', text: 'Root canal with the microscope sounded scary, but I felt nothing. Dr. Melnyk even showed me the photos afterwards. Strangely interesting.' },
    { name: 'Anna Savchenko', days: 83, rating: 5, source: 'facebook', text: 'The reception team rescheduled me twice without any fuss when work got crazy. Small thing, but it matters.' },
    { name: 'Taras Melnychuk', days: 90, rating: 3, source: 'google', text: 'Treatment was good, but the clinic was very busy that day and the visit felt a bit rushed at the end. Would still come back for the doctors.' },
    { name: 'Sofiia Kravchenko', days: 98, rating: 5, source: 'google', text: 'Replaced two old fillings that always bothered me. You honestly can\'t tell which teeth were done.' },
    { name: 'Bohdan Ivanenko', days: 110, rating: 5, source: null, text: 'Went for a checkup, left with a clear plan for the next year and no pressure to do it all at once. Exactly how it should be.' },
    { name: 'Oksana Pavlenko', days: 122, rating: 4, source: 'facebook', text: 'Lovely doctors and a very calm atmosphere. Took one star off only because the payment terminal was down and I had to come back.' },
    { name: 'Yevhen Rudenko', days: 135, rating: 5, source: 'google', text: 'My gums used to bleed every time I brushed. After the treatment and the hygiene tips from Dr. Tkachenko — nothing. Wish I had come sooner.' },
    { name: 'Mariia Lytvyn', days: 150, rating: 5, source: 'google', text: 'Veneers done by Dr. Savchuk look completely natural. Friends noticed I smile more, not that I had something done.' },
  ];

  const STAR = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
  const USER = '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 20.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const SOURCES = { facebook: ['facebook.png', 'Facebook'], google: ['google.png', 'Google'] };

  // Ukrainian names and texts, same order as REVIEWS
  const REVIEWS_UK = [
    ['Роман Шевчук', 'Майже шість років уникав стоматологів через один поганий досвід. Андрій Мельник пояснив кожен крок лікування каналів ще до початку й постійно питав, як я. Усе зайняло десь півтори години, і, чесно, найнеприємнішим був укол анестезії. Уже записав сюди дружину.'],
    ['Олег Марченко', 'У суботу зранку тріснула коронка — записали того ж дня, і ще до вечері я вийшов із новою. Не чекав такого у вихідні.'],
    ['Наталія Кравець', 'Перший візит доньки пройшов краще, ніж я сподівалася, — вона навіть спитала, коли ми прийдемо знову. Єдиний мінус — чекали хвилин 20 після призначеного часу. Персонал привітний, але про затримку могли б попередити заздалегідь.'],
    ['Вікторія Заєць', 'Чисто, спокійно й вчасно. Ірина Савчук знайшла маленький карієс, який я ще навіть не відчувала, і вилікувала за 20 хвилин.'],
    ['Андрій Лисенко', 'Ставив імплант у Тараса Бондаря. Показав 3D-знімок, пояснив, куди піде штифт і скільки триватиме загоєння. Пів року потому — відчувається як власний зуб.'],
    ['Ірина Поліщук', 'Нарешті знайшла клініку, де тебе ніхто не поспішає. Чистка була ретельна, а замість списку «що ще продати» дали чесний план.'],
    ['Дмитро Гриценко', 'Елайнери від Софії Гнатюк працюють — за чотири місяці щілина майже закрилась. Паркуватися поруч складно, але саме лікування чудове.'],
    ['Олена Мороз', 'Прийшла з яснами, що кровоточили, — ігнорувала це рік. Максим Ткаченко говорив прямо, але без жодних докорів. Два сеанси — і все під контролем.'],
    ['Сергій Бондаренко', 'Записався онлайн о 9, а об 11 вже сидів у кріслі. Увесь візит — 40 хвилин, разом із нормальним поясненням знімка.'],
    ['Катерина Шевченко', 'Син панічно боїться лікарів, а Зоя Коваль перетворила встановлення брекетів на гру. Тепер він із гордістю показує свої кольорові резиночки.'],
    ['Максим Романенко', 'Відбілювання спрацювало краще, ніж я думав, — на кілька тонів світліше за один візит. Два дні зуби були трохи чутливі, але про це попередили.'],
    ['Юлія Ткачук', 'Три коронки за тиждень і жодного сюрпризу в рахунку. Повну ціну назвали ще до початку й дотрималися її.'],
    ['Василь Коваленко', 'Лікування каналів під мікроскопом звучало страшно, а я нічого не відчув. Андрій Мельник ще й показав фото після. Дивно, але цікаво.'],
    ['Анна Савченко', 'Адміністратори двічі без жодних питань переносили мій запис, коли на роботі був аврал. Дрібниця, але важлива.'],
    ['Тарас Мельничук', 'Лікування хороше, але того дня в клініці було дуже людно, і наприкінці візит відчувався трохи поспішним. Через лікарів однаково повернуся.'],
    ['Софія Кравченко', 'Замінили дві старі пломби, які мене завжди турбували. Чесно, не відрізнити, які саме зуби лікували.'],
    ['Богдан Іваненко', 'Прийшов на огляд, а пішов із чітким планом на рік і без тиску робити все й одразу. Саме так і має бути.'],
    ['Оксана Павленко', 'Чудові лікарі й дуже спокійна атмосфера. Зірку зняла лише тому, що не працював термінал і довелося повертатися.'],
    ['Євген Руденко', 'Раніше ясна кровоточили щоразу, як чистив зуби. Після лікування й порад з гігієни від Максима Ткаченка — нічого. Шкода, що не прийшов раніше.'],
    ['Марія Литвин', 'Вініри від Ірини Савчук виглядають абсолютно природно. Друзі помітили, що я більше всміхаюся, а не те, що щось робила.'],
  ];
  if (LANG === 'uk') {
    REVIEWS.forEach((r, i) => {
      r.name = REVIEWS_UK[i][0];
      r.text = REVIEWS_UK[i][1];
    });
  }

  const ago = (d) => t('ago', d);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const sorters = {
    newest: (a, b) => a.days - b.days,
    oldest: (a, b) => b.days - a.days,
    highest: (a, b) => b.rating - a.rating || a.days - b.days,
    lowest: (a, b) => a.rating - b.rating || a.days - b.days,
  };

  let page = 1;
  const pageCount = Math.ceil(REVIEWS.length / PER_PAGE);

  const renderCard = (r, i) => {
    const stars = Array.from({ length: 5 }, (_, n) => STAR.replace('<svg', `<svg class="${n < r.rating ? 'is-on' : 'is-off'}"`)).join('');
    const avatar = r.avatar ? `<img src="${BASE}img/${r.avatar}" alt="" width="67" height="70" loading="lazy">` : USER;
    const source = r.source
      ? `<span class="review__source"><img src="${BASE}img/${SOURCES[r.source][0]}" alt="${t('reviewFrom', SOURCES[r.source][1])}" loading="lazy"></span>`
      : '';
    return `<li class="review" style="--delay: ${i * 0.08}s">
      <div class="review__stars" role="img" aria-label="${t('stars', r.rating)}">${stars}</div>
      <p class="review__score">${r.rating}<span>/5</span></p>
      <p class="review__text">${esc(r.text)}</p>
      <div class="review__foot">
        <span class="review__avatar">${avatar}</span>
        <span class="review__name">${esc(r.name)}</span>
        <span class="review__date">${ago(r.days)}</span>
      </div>
      ${source}
    </li>`;
  };

  const render = () => {
    const sorted = [...REVIEWS].sort(sorters[sortSelect.value]);
    const items = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    reviewsList.innerHTML = items.map(renderCard).join('');

    pagesEl.innerHTML = Array.from({ length: pageCount }, (_, i) => {
      const n = i + 1;
      return `<li><button type="button" data-page="${n}"${n === page ? ' aria-current="page"' : ''} aria-label="${t('page', n)}">${n}</button></li>`;
    }).join('');

    arrows[0].disabled = page === 1;
    arrows[1].disabled = page === pageCount;
  };

  const goTo = (n) => {
    page = Math.min(Math.max(n, 1), pageCount);
    render();
    // keep the list in view when the page changes
    const top = reviewsList.getBoundingClientRect().top;
    if (top < 0) {
      if (lenis) lenis.scrollTo(reviewsList, { offset: -(headerHeight() + 40) });
      else window.scrollTo({ top: window.scrollY + top - 120, behavior: 'smooth' });
    }
  };

  pagesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (btn) goTo(Number(btn.dataset.page));
  });
  arrows.forEach((a) => a.addEventListener('click', () => goTo(page + Number(a.dataset.dir))));
  sortSelect.addEventListener('change', () => { page = 1; render(); });

  render();
}

// FAQ accordion: one answer open at a time
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  const btn = item.querySelector('.faq-item__q');
  btn.addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    faqItems.forEach((other) => {
      other.classList.remove('is-open');
      other.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
    });
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
});

// Locations: selecting a clinic highlights its pin on the map
const locationCards = document.querySelectorAll('.location');
const mapPins = document.querySelectorAll('.map__pin');

locationCards.forEach((card) => {
  card.addEventListener('click', () => {
    const index = Number(card.dataset.pin);
    locationCards.forEach((c) => {
      const active = c === card;
      c.classList.toggle('is-active', active);
      c.setAttribute('aria-pressed', String(active));
    });
    mapPins.forEach((pin, i) => pin.classList.toggle('is-active', i === index));
  });
});

// Header language dropdown
const langMenu = document.getElementById('lang-menu');

if (langMenu) {
  const toggle = langMenu.querySelector('.lang-menu__toggle');
  const setOpen = (open) => {
    langMenu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setOpen(!langMenu.classList.contains('is-open')));
  document.addEventListener('click', (e) => {
    if (!langMenu.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && langMenu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// Smooth wheel scrolling (desktop) — softens every scroll-driven effect on the page
let lenis = null;

if (window.Lenis && !reduceMotion) {
  lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // anchor links scroll through Lenis too
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -(headerHeight() + 20) });
    });
  });
}

// ===== Motion effects =====
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

// 1. Text reveal: every word slides up from under a mask, line after line
const SPLIT_TARGETS = [
  '.hero__title', '.hero__lead', '.hero__text',
  '.about__title', '.services__title', '.doctors__title', '.doctors__text',
  '.compare__title', '.compare__text', '.reviews__title', '.reviews__text',
  '.faq__title', '.faq__text', '.cta__title', '.cta__text',
].join(',');

const splitWords = (root) => {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.append(document.createTextNode(part));
            return;
          }
          const word = document.createElement('span');
          const inner = document.createElement('span');
          word.className = 'sw';
          inner.className = 'sw__i';
          inner.textContent = part;
          word.append(inner);
          frag.append(word);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'BR') {
        walk(n);
      }
    });
  };
  walk(root);
};

// words on the same visual line share a delay
const setLineDelays = (root) => {
  let line = -1;
  let lastTop = null;
  root.querySelectorAll('.sw').forEach((w) => {
    const top = w.getBoundingClientRect().top;
    if (lastTop === null || Math.abs(top - lastTop) > 4) {
      line += 1;
      lastTop = top;
    }
    w.style.setProperty('--d', `${(line * 0.09).toFixed(2)}s`);
  });
};

if (!reduceMotion && 'IntersectionObserver' in window) {
  const splitEls = [...document.querySelectorAll(SPLIT_TARGETS)];

  splitEls.forEach((el) => {
    el.classList.remove('reveal'); // the word animation replaces the block reveal
    splitWords(el);
    el.classList.add('is-split');
  });

  const relayout = () => splitEls.forEach((el) => {
    if (!el.classList.contains('is-split-in')) setLineDelays(el);
  });
  relayout();
  document.fonts?.ready.then(relayout);
  window.addEventListener('resize', relayout);

  const splitObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-split-in');
      splitObserver.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  splitEls.forEach((el) => splitObserver.observe(el));
}

// 7. Images grow from 88% to full size while they scroll into view
const zoomEls = [...document.querySelectorAll('.cta__media, .ba, .map, .doctor__media, .compare__card')];

if (!reduceMotion && zoomEls.length) {
  const tick = () => {
    const vh = window.innerHeight;
    zoomEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const p = clamp01((vh - rect.top) / (vh * 0.75));
      const s = (0.88 + 0.12 * (1 - Math.pow(1 - p, 3))).toFixed(4);
      if (el.dataset.scale !== s) {
        el.dataset.scale = s;
        el.style.scale = s;
      }
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// 9. Magnetic buttons (mouse only)
if (finePointer && !reduceMotion) {
  const STRENGTH = 0.3;

  document.querySelectorAll('.btn, .icon-btn, .socials__link, .reviews__write, .map__route, .pager__arrow, .lang__btn')
    .forEach((el) => {
      let cx = 0;
      let cy = 0;
      el.classList.add('is-magnetic');

      el.addEventListener('pointerenter', () => {
        // measure the resting position (minus whatever offset is still applied)
        const rect = el.getBoundingClientRect();
        const [tx = 0, ty = 0] = (el.style.translate || '0px 0px').split(' ').map(parseFloat);
        cx = rect.left - tx + rect.width / 2;
        cy = rect.top - ty + rect.height / 2;
      });
      el.addEventListener('pointermove', (e) => {
        el.style.translate = `${((e.clientX - cx) * STRENGTH).toFixed(1)}px ${((e.clientY - cy) * STRENGTH).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.translate = '0px 0px';
      });
    });
}

// 14. Custom cursor (mouse only)
if (finePointer) {
  const cursor = document.createElement('div');
  cursor.className = 'cursor is-hidden';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor__label"></span>';
  document.body.append(cursor);
  document.documentElement.classList.add('has-cursor');

  const label = cursor.querySelector('.cursor__label');
  const pos = { x: -100, y: -100 };
  const target = { x: -100, y: -100 };
  const video = document.querySelector('.vplayer__video');

  const setState = (el) => {
    let text = '';
    if (el?.closest('.vplayer') && !el.closest('.vplayer__bar')) text = video?.paused ? t('cursorPlay') : t('cursorPause');
    else if (el?.closest('.ba')) text = t('cursorDrag');

    cursor.classList.toggle('is-label', Boolean(text));
    cursor.classList.toggle('is-link', !text && Boolean(el?.closest('a, button, select, label, input, [role="button"]')));
    if (text && label.textContent !== text) label.textContent = text;
  };

  document.addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    cursor.classList.remove('is-hidden');
    setState(e.target);
  });
  document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  video?.addEventListener('play', () => setState(document.elementFromPoint(target.x, target.y)));
  video?.addEventListener('pause', () => setState(document.elementFromPoint(target.x, target.y)));

  const follow = () => {
    pos.x += (target.x - pos.x) * 0.28;
    pos.y += (target.y - pos.y) * 0.28;
    cursor.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

// 16. Language switch: fade the page out behind a curtain, the other page fades in
document.querySelectorAll('a[hreflang]').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (a.getAttribute('aria-current') === 'page') return;
    try { sessionStorage.setItem('klyk-lang', '1'); } catch (err) { /* private mode: no fade-in, still works */ }
    document.documentElement.classList.add('is-leaving');
    setTimeout(() => { window.location.href = a.href; }, 500);
  });
});

// back/forward cache can restore the page with the curtain still down
window.addEventListener('pageshow', () => document.documentElement.classList.remove('is-leaving'));

if (document.documentElement.classList.contains('is-entering')) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.remove('is-entering');
  }));
}

// Mobile menu
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

if (burger && nav) {
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? t('closeMenu') : t('openMenu'));
  };

  burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
}
