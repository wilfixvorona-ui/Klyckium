// Structured data (JSON-LD) for search engines: the clinic network, its three locations and the FAQ.
// The FAQ is read from the page itself, so it always matches what visitors see.
const SITE = 'https://klykium.com';

const CLINICS = {
  en: [
    { id: 'levandivka', name: 'Klykium Levandivka', street: '8 Lypynskoho St', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], closes: '19:00' },
    { id: 'center', name: 'Klykium Center', street: '12 Doroshenka St', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], closes: '20:00' },
    { id: 'sykhiv', name: 'Klykium Sykhiv', street: '45 Chervonoi Kalyny Ave', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], closes: '20:00' },
  ],
  uk: [
    { id: 'levandivka', name: 'Klykium Левандівка', street: 'вул. Липинського, 8' },
    { id: 'center', name: 'Klykium Центр', street: 'вул. Дорошенка, 12' },
    { id: 'sykhiv', name: 'Klykium Сихів', street: 'просп. Червоної Калини, 45' },
  ],
};

const TEXT = {
  en: { url: `${SITE}/`, city: 'Lviv', description: 'Dental clinics in Lviv: checkups, orthodontics, implants, root canal and gum treatment.' },
  uk: { url: `${SITE}/ua/`, city: 'Львів', description: 'Стоматологічні клініки у Львові: огляди, ортодонтія, імплантація, лікування каналів і ясен.' },
};

const decode = (s) => s
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const faqFromHtml = (html) => {
  const items = [];
  const re = /<button class="faq-item__q"[^>]*>\s*<span>([\s\S]*?)<\/span>[\s\S]*?<div><p>([\s\S]*?)<\/p><\/div>/g;
  let m;
  while ((m = re.exec(html))) items.push({ q: decode(m[1]), a: decode(m[2]) });
  return items;
};

const buildLd = (html, lang) => {
  const txt = TEXT[lang];
  const org = `${SITE}/#organization`;

  const clinics = CLINICS.en.map((base, i) => {
    const local = CLINICS[lang][i];
    return {
      '@type': 'Dentist',
      '@id': `${SITE}/#clinic-${base.id}`,
      name: local.name,
      url: txt.url,
      image: `${SITE}/img/og-image.jpg`,
      telephone: '+380320000000',
      email: 'hello@klykium.com',
      priceRange: '$$',
      parentOrganization: { '@id': org },
      address: {
        '@type': 'PostalAddress',
        streetAddress: local.street,
        addressLocality: txt.city,
        addressCountry: 'UA',
      },
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: base.days,
        opens: '09:00',
        closes: base.closes,
      }],
    };
  });

  const graph = [
    {
      '@type': 'MedicalOrganization',
      '@id': org,
      name: 'Klykium',
      url: `${SITE}/`,
      logo: `${SITE}/img/icon-512.png`,
      description: txt.description,
      telephone: '+380320000000',
      email: 'hello@klykium.com',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'Klykium',
      inLanguage: ['en', 'uk'],
      publisher: { '@id': org },
    },
    ...clinics,
    {
      '@type': 'FAQPage',
      '@id': `${txt.url}#faq`,
      inLanguage: lang,
      mainEntity: faqFromHtml(html).map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ];

  // "</" must not appear inside a <script> block
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">\n${json}\n  </script>`;
};

// Replaces everything between the ld:start / ld:end markers in <head>
const injectLd = (html, lang) => {
  const re = /(<!-- ld:start[^>]*-->)[\s\S]*?(\s*<!-- ld:end -->)/;
  if (!re.test(html)) throw new Error('ld:start / ld:end markers not found in <head>');
  return html.replace(re, (_, start, end) => `${start}\n  ${buildLd(html, lang)}${end}`);
};

module.exports = { injectLd, SITE };
