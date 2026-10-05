// Builds the Ukrainian page (ua/index.html) from the English index.html
// and refreshes the structured data (JSON-LD) of both pages.
// Usage: node tools/build-ua.js   — run it again after every change to index.html.
// Every [en, uk] pair must be found in the source, otherwise the build stops and says which one is missing.
const fs = require('fs');
const path = require('path');
const { injectLd } = require('./seo');

const root = path.join(__dirname, '..');
const enPath = path.join(root, 'index.html');

// English page: refresh its JSON-LD from the current FAQ texts
const enSource = fs.readFileSync(enPath, 'utf8');
const enHtml = injectLd(enSource, 'en');
if (enHtml !== enSource) fs.writeFileSync(enPath, enHtml);

let html = enHtml;

const missing = [];
const replaceAll = (from, to) => {
  if (!html.includes(from)) missing.push(from);
  html = html.split(from).join(to);
};

// ---- page setup: language, asset paths (the page lives one folder deeper), language switch ----
const setup = [
  ['<html lang="en">', '<html lang="uk" data-base="../">'],
  ['src="img/', 'src="../img/'],
  ['poster="img/', 'poster="../img/'],
  ['src="video/', 'src="../video/'],
  ['src="js/', 'src="../js/'],
  ['href="css/', 'href="../css/'],
  ['href="img/', 'href="../img/'],
  ['<link rel="icon" href="favicon.ico"', '<link rel="icon" href="../favicon.ico"'],
  ['<link rel="manifest" href="site.webmanifest">', '<link rel="manifest" href="../site.webmanifest">'],
  ['<link rel="canonical" href="https://klykium.com/">', '<link rel="canonical" href="https://klykium.com/ua/">'],
  ['<meta property="og:url" content="https://klykium.com/">', '<meta property="og:url" content="https://klykium.com/ua/">'],
  ['<meta property="og:locale" content="en_US">\n  <meta property="og:locale:alternate" content="uk_UA">',
    '<meta property="og:locale" content="uk_UA">\n  <meta property="og:locale:alternate" content="en_US">'],
  ['<a class="lang__btn is-active" href="./" hreflang="en" aria-current="page" aria-label="English">',
    '<a class="lang__btn" href="../" hreflang="en" lang="en" aria-label="English">'],
  ['<a class="lang__btn" href="ua/" hreflang="uk" lang="uk" aria-label="Українська">',
    '<a class="lang__btn is-active" href="./" hreflang="uk" aria-current="page" aria-label="Українська">'],
  // header language dropdown (runs after the img path change above)
  ['aria-label="Language: English">\n            <img src="../img/flag-en.svg"',
    'aria-label="Мова: українська">\n            <img src="../img/flag-ua.svg"'],
  ['<a class="lang-menu__item" href="./" hreflang="en" aria-current="page">',
    '<a class="lang-menu__item" href="../" hreflang="en" lang="en">'],
  ['<a class="lang-menu__item" href="ua/" hreflang="uk" lang="uk">',
    '<a class="lang-menu__item" href="./" hreflang="uk" aria-current="page">'],
];

// ---- texts. Longer / more specific strings go first ----
const texts = [
  // head
  // title and description appear in <title>, description, og: and twitter: tags — all replaced at once
  ['Klykium Dental Clinic in Lviv — Implants, Braces &amp; Checkups',
    'Стоматологія Klykium у Львові — імплантація, брекети, огляди'],
  ['Klykium dental clinics in Lviv: checkups from $40, braces and aligners, implants, root canal and gum treatment. Three locations and same-day emergency care.',
    'Стоматологічні клініки Klykium у Львові: огляд від 1 600 ₴, брекети й елайнери, імплантація, лікування каналів і ясен. Три клініки та невідкладна допомога в день звернення.'],
  ['content="Klykium — other clinics smile, we show teeth"', 'content="Klykium — інші клініки всміхаються, ми показуємо зуби"'],
  ['Klykium — dental clinic in Lviv. ', 'Klykium — стоматологічна клініка у Львові. '],

  // header
  ['aria-label="Klykium home"', 'aria-label="Klykium — на головну"'],
  ['>Our Doctors<', '>Лікарі<'],
  ['aria-label="Our clinics on the map"', 'aria-label="Наші клініки на мапі"'],
  ['<span>Book a Consultation</span>', '<span>Записатися на прийом</span>'],
  ['aria-label="Open menu"', 'aria-label="Відкрити меню"'],

  // hero
  ['>Other clinics smile<', '>Інші клініки всміхаються<'],
  ['>We <em>show</em> teeth<', '>Ми <em>показуємо</em> зуби<'],
  ["Named after the canine tooth, built for smiles you don't cover with your hand.",
    'Названа на честь ікла — для усмішок, які не хочеться прикривати рукою.'],
  ['A polite smile hides more than it shows. We treat, align and restore your teeth until laughing out loud feels natural again — no filters, no covering up.',
    'Ввічлива усмішка приховує більше, ніж показує. Ми лікуємо, вирівнюємо й відновлюємо зуби, доки сміятися вголос знову не стане природним — без фільтрів і без прикривання рукою.'],

  // about
  ['>About us<', '>Про нас<'],
  ["We could tell you we're good. Or you could just look at the <em>numbers</em>",
    'Можемо довго розповідати, які ми хороші. Або просто подивіться на <em>цифри</em>'],
  ['years of hands-on <br>clinical experience', 'років практичного <br>клінічного досвіду'],
  ['>8,400+<', '>8 400+<'],
  ['patients treated <br>since we opened', 'пацієнтів пролікували <br>з дня відкриття'],
  ['pain-free procedures, <br>per patient feedback', 'процедур без болю — <br>за відгуками пацієнтів'],
  ['doctors under one roof no <br>bouncing between clinics', 'лікар під одним дахом — <br>без поїздок між клініками'],
  ['aria-label="Play video"', 'aria-label="Відтворити відео"'],
  ['aria-label="Video progress"', 'aria-label="Прогрес відео"'],
  ['<span>Watch the video on YouTube</span>', '<span>Дивитися відео на YouTube</span>'],

  // services
  ['The figures show how much we have accomplished. Here is exactly what we do',
    'Цифри показують, чого ми досягли. А ось що саме ми робимо'],
  ['alt="Dental checkup tools and a toothbrush"', 'alt="Інструменти для огляду та зубна щітка"'],
  ['alt="Dental model with braces and a clear aligner"', 'alt="Модель щелепи з брекетами та прозорий елайнер"'],
  ['alt="Dental implant model and a smile"', 'alt="Модель зубного імпланта та усмішка"'],
  ['alt="Tooth restoration model"', 'alt="Модель реставрації зуба"'],
  ['alt="Tooth root canal model"', 'alt="Модель кореневих каналів зуба"'],
  ['alt="Gum treatment model"', 'alt="Модель для лікування ясен"'],
  ['>General Dentistry<', '>Терапевтична стоматологія<'],
  ['>Restorative Dentistry<', '>Реставрація зубів<'],
  ['>Pediatric Dentistry<', '>Дитяча стоматологія<'],
  ['>Dental Implants<', '>Імплантація<'],
  ['>Orthodontics<', '>Ортодонтія<'],
  ['>Endodontics<', '>Ендодонтія<'],
  ['>Periodontics<', '>Пародонтологія<'],
  ['>Periodontal Care<', '>Лікування ясен<'],
  ['>Emergency Care<', '>Невідкладна допомога<'],
  ['Checkups, cleanings and early problem spotting', 'Огляди, професійна чистка й раннє виявлення проблем'],
  ['Crooked teeth, gaps or an uneven bite', 'Криві зуби, щілини чи неправильний прикус'],
  ['Missing one tooth or several', 'Немає одного зуба або кількох'],
  ['Chipped, cracked or decayed teeth', 'Сколоті, тріснуті чи зруйновані карієсом зуби'],
  ['Tooth pain, deep decay or root canal treatment', 'Зубний біль, глибокий карієс чи лікування каналів'],
  ['Bleeding, swollen or receding gums', 'Ясна кровоточать, набрякають чи оголюють корені зубів'],
  ['>From $1,200<', '>Від 49 000 ₴<'],
  ['>From $40<', '>Від 1 600 ₴<'],
  ['>From $90<', '>Від 3 700 ₴<'],
  ['>From $180<', '>Від 7 400 ₴<'],
  ['>From $70<', '>Від 2 900 ₴<'],
  ['>40-45 mins<', '>40–45 хв<'],
  ['>6–18 months<', '>6–18 місяців<'],
  ['>1 visit<', '>1 візит<'],
  ['>90 min<', '>90 хв<'],
  ['>60 min<', '>60 хв<'],

  // doctors
  ['>Our doctors<', '>Наші лікарі<'],
  ['Anyone can wear a white coat. Not everyone earns it.', 'Білий халат може вдягнути кожен. Заслужити його — ні.'],
  ["Every specialist here focuses on one thing and does it thousands of times. You'll know exactly who's treating you before you ever sit in the chair.",
    'Кожен спеціаліст тут займається чимось одним і робить це тисячі разів. Ви точно знатимете, хто вас лікує, ще до того, як сядете в крісло.'],
  ['aria-label="Call ', 'aria-label="Зателефонувати: '],
  ['Dr. Sofia Hnatiuk', 'Софія Гнатюк'],
  ['Dr. Andriy Melnyk', 'Андрій Мельник'],
  ['Dr. Iryna Savchuk', 'Ірина Савчук'],
  ['Dr. Zoya Koval', 'Зоя Коваль'],
  ['Dr. Maksym Tkachenko', 'Максим Ткаченко'],
  ['Dr. Taras Bondar', 'Тарас Бондар'],
  ['>Founder<', '>Засновниця<'],
  ['>Head of Endodontics<', '>Головний ендодонтист<'],
  ['>Clinical Director<', '>Клінічна директорка<'],
  ['<li>Orthodontist</li>', '<li>Ортодонтка</li>'],
  ['<li>Braces &amp; aligners</li>', '<li>Брекети й елайнери</li>'],
  ['<li>1,400+ smiles aligned</li>', '<li>1 400+ вирівняних усмішок</li>'],
  ['<li>Endodontist</li>', '<li>Ендодонтист</li>'],
  ['<li>Root canal</li>', '<li>Лікування каналів</li>'],
  ['<li>2,000+ microscope treatments</li>', '<li>2 000+ процедур під мікроскопом</li>'],
  ['<li>Restorative Dentist</li>', '<li>Реставрація зубів</li>'],
  ['<li>Same-day crowns specialist</li>', '<li>Коронки за один день</li>'],
  ['<li>Kids &amp; teens</li>', '<li>Діти й підлітки</li>'],
  ['<li>900+ young smiles straightened</li>', '<li>900+ вирівняних дитячих усмішок</li>'],
  ['<li>Periodontist</li>', '<li>Пародонтолог</li>'],
  ['<li>Trained in surgery in Vienna</li>', '<li>Стажування з хірургії у Відні</li>'],
  ['<li>Implantologist</li>', '<li>Імплантолог</li>'],
  ['<li>3,200+ implants placed</li>', '<li>3 200+ встановлених імплантів</li>'],
  ['<li>7 years</li>', '<li>7 років</li>'],
  ['<li>8 years</li>', '<li>8 років</li>'],
  ['<li>9 years</li>', '<li>9 років</li>'],
  ['<li>10 years</li>', '<li>10 років</li>'],
  ['<li>12 years</li>', '<li>12 років</li>'],

  // before / after
  ['<span>Before/After</span>', '<span>До / Після</span>'],
  ['See the difference for yourself', 'Побачте різницю на власні очі'],
  ['Drag the slider to compare the smile our patients came in with and the one they left with.',
    'Потягніть повзунок, щоб порівняти усмішку, з якою пацієнти прийшли, і ту, з якою пішли.'],
  ['alt="Smile after treatment"', 'alt="Усмішка після лікування"'],
  ['alt="Smile before treatment"', 'alt="Усмішка до лікування"'],
  ['aria-label="Compare before and after"', 'aria-label="Порівняти до і після"'],
  ['>Before / After<', '>До / Після<'],
  ['>Before<', '>До<'],
  ['>After<', '>Після<'],

  // reviews
  ['>Patient reviews<', '>Відгуки пацієнтів<'],
  ['What our patients say after they leave', 'Що кажуть пацієнти після візиту'],
  ["From first checkups to full smile makeovers, here's how treatment at Klykium actually felt.",
    'Від першого огляду до повного перетворення усмішки — ось яким пацієнти запам’ятали лікування в Klykium.'],
  ['>Sort reviews<', '>Сортувати відгуки<'],
  ['>Newest reviews<', '>Найновіші відгуки<'],
  ['>Oldest reviews<', '>Найстаріші відгуки<'],
  ['>Highest rated<', '>Найвища оцінка<'],
  ['>Lowest rated<', '>Найнижча оцінка<'],
  ['>Write a review<', '>Залишити відгук<'],
  ['aria-label="Reviews pages"', 'aria-label="Сторінки відгуків"'],
  ['aria-label="Previous page"', 'aria-label="Попередня сторінка"'],
  ['aria-label="Next page"', 'aria-label="Наступна сторінка"'],

  // faq
  ['Answers to the questions patients ask us most', 'Відповіді на запитання, які нам ставлять найчастіше'],
  ["From pain and prices to what happens on your first visit, here's what people usually want to know before booking. Didn't find your question? Send it to us and a doctor will reply within a day.",
    'Від болю й цін до того, що відбувається на першому візиті, — ось що зазвичай хочуть знати перед записом. Не знайшли свого питання? Надішліть його нам, і лікар відповість протягом дня.'],
  ['Will the treatment hurt?', 'Чи буде боляче?'],
  ['Almost never. We numb the area properly before any procedure and check in with you as we go. Most patients say the injection is the only thing they feel.',
    'Майже ніколи. Перед будь-якою процедурою ми якісно знеболюємо й постійно питаємо, як ви почуваєтесь. Більшість пацієнтів кажуть, що відчули лише укол анестезії.'],
  ['How much does a visit cost?', 'Скільки коштує візит?'],
  ['A checkup with cleaning starts from $40. For anything more, you get a written treatment plan with the full price before we begin, so there are no surprises on the bill.',
    'Огляд із чисткою — від 1 600 ₴. Для складніших випадків ви отримуєте письмовий план лікування з повною ціною ще до початку, тож жодних сюрпризів у рахунку.'],
  ['What happens on my first visit?', 'Що буде на першому візиті?'],
  ['We take a look, make X-rays if needed and talk through what we see. You leave with a clear plan and decide what to do next — nothing starts without your OK.',
    'Ми оглянемо зуби, за потреби зробимо знімок і пояснимо, що бачимо. Ви підете з чітким планом і самі вирішите, що робити далі, — без вашої згоди нічого не починаємо.'],
  ['Can I choose my doctor?', 'Чи можу я обрати лікаря?'],
  ['Yes. You can book directly with any specialist from the "Our doctors" section, or we\'ll match you with the right one based on your problem.',
    'Так. Можна записатися напряму до будь-кого з розділу «Наші лікарі» або ми самі підберемо спеціаліста під вашу проблему.'],
  ['What should I do if I have sudden tooth pain?', 'Що робити, якщо раптово заболів зуб?'],
  ['Call us right away. We keep same-day slots for emergencies, including Saturdays, and will tell you what to do until you get to the chair.',
    'Одразу телефонуйте нам. Для екстрених випадків ми тримаємо вільні години того ж дня, зокрема в суботу, і підкажемо, що робити, поки ви до нас доїдете.'],
  ['Do you treat children?', 'Чи лікуєте ви дітей?'],
  ["Yes, from the age of three. Dr. Koval works with kids and teens, and we keep the first visit short and playful so it doesn't feel scary.",
    'Так, від трьох років. З дітьми й підлітками працює Зоя Коваль, а перший візит ми робимо коротким та ігровим, щоб не було страшно.'],
  ['Is there a warranty on treatment?', 'Чи є гарантія на лікування?'],
  ['Fillings, crowns and implants come with a warranty from 1 to 5 years, depending on the treatment. The exact terms are written in your plan.',
    'На пломби, коронки й імпланти діє гарантія від 1 до 5 років залежно від лікування. Точні умови прописані у вашому плані.'],
  ['Can I pay in installments?', 'Чи можна оплатити частинами?'],
  ["Yes. Treatments over $500 can be split into monthly payments with no extra fees. Ask the reception team and they'll set it up in a few minutes.",
    'Так. Лікування понад 20 000 ₴ можна розбити на щомісячні платежі без переплат. Скажіть адміністратору — це займе кілька хвилин.'],
  ['How often should I come for a checkup?', 'Як часто треба приходити на огляд?'],
  ['Every six months works for most people. If you have braces, implants or gum issues, your doctor may suggest coming a bit more often.',
    'Більшості людей достатньо раз на пів року. Якщо у вас брекети, імпланти чи проблеми з яснами, лікар може порадити приходити частіше.'],
  ['<span>FAQ</span>', '<span>Часті питання</span>'],
  ['>FAQ<', '>Часті питання<'],

  // cta
  ['<span>Book a consultation</span>', '<span>Запис на консультацію</span>'],
  ['Ready to <em>stop</em> covering your smile?', 'Готові <em>перестати</em> ховати усмішку?'],
  ['alt="Treatment room at Klykium"', 'alt="Кабінет клініки Klykium"'],
  ["Choose a doctor, pick a time that suits you, and we'll take care of the rest from your very first visit.",
    'Оберіть лікаря й зручний час, а про все інше ми подбаємо з першого ж візиту.'],

  // locations
  ['aria-label="Our clinics"', 'aria-label="Наші клініки"'],
  ['>Klykium Levandivka<', '>Klykium Левандівка<'],
  ['>Klykium Center<', '>Klykium Центр<'],
  ['>Klykium Sykhiv<', '>Klykium Сихів<'],
  ['>8 Lypynskoho St, Lviv<', '>вул. Липинського, 8, Львів<'],
  ['>12 Doroshenka St, Lviv<', '>вул. Дорошенка, 12, Львів<'],
  ['>45 Chervonoi Kalyny Ave, Lviv<', '>просп. Червоної Калини, 45, Львів<'],
  ['>Mon–Fri 9:00–19:00 (concept)<', '>Пн–Пт 9:00–19:00 (концепт)<'],
  ['>Mon–Sat 9:00–20:00 (concept)<', '>Пн–Сб 9:00–20:00 (концепт)<'],
  ['alt="Map of Klykium clinics"', 'alt="Мапа клінік Klykium"'],
  ['Find the fastest route to a nearby clinic.', 'Знайдіть найшвидший маршрут до найближчої клініки.'],

  // footer
  ['aria-label="Klykium — back to top"', 'aria-label="Klykium — нагору"'],
  ['aria-label="Language"', 'aria-label="Мова"'],
  ['aria-label="Clinic"', 'aria-label="Клініка"'],
  ['aria-label="Services"', 'aria-label="Послуги"'],
  ['aria-label="Legal"', 'aria-label="Правова інформація"'],
  ['>Clinic<', '>Клініка<'],
  ['>Legal<', '>Документи<'],
  ['>Contacts<', '>Контакти<'],
  ['>Locations<', '>Адреси<'],
  ['>Privacy Policy<', '>Політика конфіденційності<'],
  ['>Terms of Use<', '>Умови використання<'],
  ['>Cookie Policy<', '>Політика щодо файлів cookie<'],
  ['>Medical License<', '>Медична ліцензія<'],
  ['>Patient Rights<', '>Права пацієнтів<'],
  ['>Public Offer<', '>Публічна оферта<'],
  ['>Medical Disclaimer<', '>Медичне застереження<'],
  ['<li>Phone: <a', '<li>Телефон: <a'],
  ['<li>Emergency line (7 days): <a', '<li>Гаряча лінія (без вихідних): <a'],
  ['© 2026 Klykium Dental Clinics. All rights reserved.', '© 2026 Стоматологічні клініки Klykium. Усі права захищено.'],

  // short shared words last
  ['<span>Services</span>', '<span>Послуги</span>'],
  ['>Services<', '>Послуги<'],
  ['>Reviews<', '>Відгуки<'],
  ['>Home<', '>Головна<'],
];

[...setup, ...texts].forEach(([en, uk]) => replaceAll(en, uk));

if (missing.length) {
  console.error('Not found in index.html (update tools/build-ua.js):\n- ' + missing.join('\n- '));
  process.exit(1);
}

html = injectLd(html, 'uk');

fs.mkdirSync(path.join(root, 'ua'), { recursive: true });
fs.writeFileSync(path.join(root, 'ua', 'index.html'), html);
console.log('ua/index.html built');
