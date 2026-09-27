// Generates Site/<lang>/<edition>/index.html — one SEO landing page per
// edition x language, linking hreflang, with meta description, Open Graph
// and an iOS smart-app-banner. Run: node scripts/gen-seo-pages.mjs
//
// Static output committed to the repo (GitHub Pages serves plain files —
// no build step there), this script is just the one-shot template so 35
// pages don't have to be hand-maintained separately.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE_URL = 'https://guilhemtuffal1-rgb.github.io';
const LANGS = ['en', 'fr', 'es', 'de', 'pt'];
const OG_LOCALE = { en: 'en_US', fr: 'fr_FR', es: 'es_ES', de: 'de_DE', pt: 'pt_PT' };

const UI = {
  en: { android: 'Get it on Google Play', ios: 'Download on the App Store', allEditions: 'See all 7 editions',
        free: 'Free to play', alsoIn: 'Also available in:', modesLabel: 'game modes' },
  fr: { android: 'Disponible sur Google Play', ios: "Télécharger sur l'App Store", allEditions: 'Voir les 7 éditions',
        free: 'Gratuit', alsoIn: 'Disponible aussi en :', modesLabel: 'modes de jeu' },
  es: { android: 'Disponible en Google Play', ios: 'Descargar en App Store', allEditions: 'Ver las 7 ediciones',
        free: 'Gratis', alsoIn: 'También disponible en:', modesLabel: 'modos de juego' },
  de: { android: 'Jetzt bei Google Play', ios: 'Im App Store laden', allEditions: 'Alle 7 Editionen ansehen',
        free: 'Kostenlos spielbar', alsoIn: 'Auch verfügbar auf:', modesLabel: 'Spielmodi' },
  pt: { android: 'Disponível no Google Play', ios: 'Baixar na App Store', allEditions: 'Ver as 7 edições',
        free: 'Grátis para jogar', alsoIn: 'Também disponível em:', modesLabel: 'modos de jogo' },
};

const LANG_NAMES = {
  en: { en: 'English', fr: 'French', es: 'Spanish', de: 'German', pt: 'Portuguese' },
  fr: { en: 'Anglais', fr: 'Français', es: 'Espagnol', de: 'Allemand', pt: 'Portugais' },
  es: { en: 'Inglés', fr: 'Francés', es: 'Español', de: 'Alemán', pt: 'Portugués' },
  de: { en: 'Englisch', fr: 'Französisch', es: 'Spanisch', de: 'Deutsch', pt: 'Portugiesisch' },
  pt: { en: 'Inglês', fr: 'Francês', es: 'Espanhol', de: 'Alemão', pt: 'Português' },
};

// slug must match Site/get/redirect.mjs EDITIONS keys.
const EDITIONS = [
  {
    slug: 'world', folder: 'Presentation-Periplo', androidId: 'com.guigui314.GeoMaster', iosId: '6764830622',
    color1: '#00695C', color2: '#00796B', accent: '#4DB6AC', stat: 195, modes: 8, unit: 'countries',
    name: { en: 'Periplo World', fr: 'Periplo Monde', es: 'Periplo Mundo', de: 'Periplo Welt', pt: 'Periplo Mundo' },
    tagline: {
      en: 'Geography & Flags Quiz', fr: 'Quiz de Géographie et Drapeaux', es: 'Quiz de Geografía y Banderas',
      de: 'Geografie- und Flaggen-Quiz', pt: 'Quiz de Geografia e Bandeiras',
    },
    desc: {
      en: 'Master world geography with Periplo: 195 countries, flags, capitals, populations and map quizzes across 8 game modes. Free to play.',
      fr: 'Periplo Monde : maîtrisez la géographie mondiale avec 195 pays, drapeaux, capitales et quiz de cartes en 8 modes de jeu. Gratuit.',
      es: 'Periplo Mundo: domina la geografía mundial con 195 países, banderas, capitales y quizzes de mapas en 8 modos de juego. Gratis.',
      de: 'Periplo Welt: Meistere die Weltgeografie mit 195 Ländern, Flaggen, Hauptstädten und Kartenquiz in 8 Spielmodi. Kostenlos.',
      pt: 'Periplo Mundo: domine a geografia mundial com 195 países, bandeiras, capitais e quizzes de mapas em 8 modos de jogo. Grátis.',
    },
  },
  {
    slug: 'europe', folder: 'Presentation-Periplo_EU_Edition', androidId: 'com.guigui314.GeoMastereuEdition', iosId: '6764586510',
    color1: '#1565C0', color2: '#0D47A1', accent: '#64B5F6', stat: 44, modes: 8, unit: 'countries',
    name: { en: 'Periplo Europe', fr: 'Periplo Europe', es: 'Periplo Europa', de: 'Periplo Europa', pt: 'Periplo Europa' },
    tagline: {
      en: 'Geography & Flags Quiz', fr: 'Quiz de Géographie et Drapeaux', es: 'Quiz de Geografía y Banderas',
      de: 'Geografie- und Flaggen-Quiz', pt: 'Quiz de Geografia e Bandeiras',
    },
    desc: {
      en: 'Periplo Europe: learn the flags, capitals and organisations of 44 European countries with fast, fun geography quizzes. Free to play.',
      fr: 'Periplo Europe : apprenez les drapeaux, capitales et organisations de 44 pays européens avec des quiz de géographie rapides et gratuits.',
      es: 'Periplo Europa: aprende las banderas, capitales y organizaciones de 44 países europeos con quizzes de geografía rápidos y gratuitos.',
      de: 'Periplo Europa: Lerne Flaggen, Hauptstädte und Organisationen von 44 europäischen Ländern mit schnellen, kostenlosen Geografie-Quiz.',
      pt: 'Periplo Europa: aprenda as bandeiras, capitais e organizações de 44 países europeus com quizzes de geografia rápidos e gratuitos.',
    },
  },
  {
    slug: 'africa', folder: 'Presentation-Periplo_AF_Edition', androidId: 'com.guigui314.GeoMasterafEdition', iosId: '6764829384',
    color1: '#C62828', color2: '#BF360C', accent: '#EF9A9A', stat: 54, modes: 8, unit: 'countries',
    name: { en: 'Periplo Africa', fr: 'Periplo Afrique', es: 'Periplo África', de: 'Periplo Afrika', pt: 'Periplo África' },
    tagline: {
      en: 'Geography & Flags Quiz', fr: 'Quiz de Géographie et Drapeaux', es: 'Quiz de Geografía y Banderas',
      de: 'Geografie- und Flaggen-Quiz', pt: 'Quiz de Geografia e Bandeiras',
    },
    desc: {
      en: 'Periplo Africa: discover the flags, capitals and organisations of all 54 African countries with fun geography quizzes. Free to play.',
      fr: "Periplo Afrique : découvrez les drapeaux, capitales et organisations des 54 pays d'Afrique grâce à des quiz de géographie ludiques. Gratuit.",
      es: 'Periplo África: descubre las banderas, capitales y organizaciones de los 54 países de África con quizzes de geografía divertidos. Gratis.',
      de: 'Periplo Afrika: Entdecke Flaggen, Hauptstädte und Organisationen aller 54 afrikanischen Länder mit unterhaltsamen Geografie-Quiz.',
      pt: 'Periplo África: descubra as bandeiras, capitais e organizações dos 54 países da África com quizzes de geografia divertidos. Grátis.',
    },
  },
  {
    slug: 'americas', folder: 'Presentation-Periplo_AM_Edition', androidId: 'com.guigui314.GeoMasteramEdition', iosId: '6766255124',
    color1: '#2E7D32', color2: '#1B5E20', accent: '#A5D6A7', stat: 35, modes: 8, unit: 'countries',
    name: { en: 'Periplo Americas', fr: 'Periplo Amériques', es: 'Periplo Américas', de: 'Periplo Amerika', pt: 'Periplo Américas' },
    tagline: {
      en: 'Geography & Flags Quiz', fr: 'Quiz de Géographie et Drapeaux', es: 'Quiz de Geografía y Banderas',
      de: 'Geografie- und Flaggen-Quiz', pt: 'Quiz de Geografia e Bandeiras',
    },
    desc: {
      en: 'Periplo Americas: from Alaska to Patagonia, master the flags and capitals of 35 countries across North & South America. Free to play.',
      fr: "Periplo Amériques : de l'Alaska à la Patagonie, maîtrisez les drapeaux et capitales des 35 pays d'Amérique. Quiz gratuit et rapide.",
      es: 'Periplo Américas: de Alaska a la Patagonia, domina las banderas y capitales de 35 países de América. Quiz gratuito y rápido.',
      de: 'Periplo Amerika: Von Alaska bis Patagonien – meistere Flaggen und Hauptstädte von 35 Ländern Nord- und Südamerikas. Kostenlos.',
      pt: 'Periplo Américas: do Alasca à Patagônia, domine as bandeiras e capitais de 35 países das Américas. Quiz gratuito e rápido.',
    },
  },
  {
    slug: 'asia', folder: 'Presentation-Periplo_AS_Edition', androidId: 'com.guigui314.GeoMasterasEdition', iosId: '6764829781',
    color1: '#6A1B9A', color2: '#E65100', accent: '#CE93D8', stat: 48, modes: 8, unit: 'countries',
    name: { en: 'Periplo Asia', fr: 'Periplo Asie', es: 'Periplo Asia', de: 'Periplo Asien', pt: 'Periplo Ásia' },
    tagline: {
      en: 'Geography & Flags Quiz', fr: 'Quiz de Géographie et Drapeaux', es: 'Quiz de Geografía y Banderas',
      de: 'Geografie- und Flaggen-Quiz', pt: 'Quiz de Geografia e Bandeiras',
    },
    desc: {
      en: 'Periplo Asia: challenge yourself on the flags, capitals and organisations of 48 Asian countries with fast-paced quizzes. Free to play.',
      fr: "Periplo Asie : testez vos connaissances sur les drapeaux, capitales et organisations des 48 pays d'Asie avec des quiz rapides. Gratuit.",
      es: 'Periplo Asia: pon a prueba tus conocimientos sobre banderas, capitales y organizaciones de 48 países asiáticos. Gratis y rápido.',
      de: 'Periplo Asien: Teste dein Wissen über Flaggen, Hauptstädte und Organisationen von 48 asiatischen Ländern. Schnell und kostenlos.',
      pt: 'Periplo Ásia: teste seus conhecimentos sobre bandeiras, capitais e organizações de 48 países asiáticos. Grátis e rápido.',
    },
  },
  {
    slug: 'pacific', folder: 'Presentation-Periplo_PA_Edition', androidId: 'com.guigui314.GeoMasterpaEdition', iosId: '6764829855',
    color1: '#0277BD', color2: '#006064', accent: '#4FC3F7', stat: 14, modes: 8, unit: 'countries',
    name: { en: 'Periplo Pacific', fr: 'Periplo Pacifique', es: 'Periplo Pacífico', de: 'Periplo Pazifik', pt: 'Periplo Pacífico' },
    tagline: {
      en: 'Geography & Flags Quiz', fr: 'Quiz de Géographie et Drapeaux', es: 'Quiz de Geografía y Banderas',
      de: 'Geografie- und Flaggen-Quiz', pt: 'Quiz de Geografia e Bandeiras',
    },
    desc: {
      en: 'Periplo Pacific: explore the flags and capitals of 14 island nations across Oceania and the Pacific. Free, fun geography quiz.',
      fr: "Periplo Pacifique : explorez les drapeaux et capitales de 14 nations insulaires d'Océanie et du Pacifique. Quiz gratuit et ludique.",
      es: 'Periplo Pacífico: explora las banderas y capitales de 14 naciones insulares de Oceanía y el Pacífico. Quiz gratuito y divertido.',
      de: 'Periplo Pazifik: Entdecke Flaggen und Hauptstädte von 14 Inselstaaten in Ozeanien und im Pazifik. Kostenloses Geografie-Quiz.',
      pt: 'Periplo Pacífico: explore as bandeiras e capitais de 14 nações insulares da Oceania e do Pacífico. Quiz gratuito e divertido.',
    },
  },
  {
    slug: 'us', folder: 'Presentation-Periplo_US_Edition', androidId: 'com.guigui314.GeoMasterUSEdition', iosId: '6766081243',
    color1: '#283593', color2: '#B71C1C', accent: '#90CAF9', stat: 50, modes: 6, unit: 'states',
    name: { en: 'Periplo US States', fr: 'Periplo États-Unis', es: 'Periplo Estados Unidos', de: 'Periplo USA', pt: 'Periplo Estados Unidos' },
    tagline: {
      en: '50 States Quiz — Capitals, Flags & Maps', fr: 'Quiz des 50 États — Capitales, Drapeaux et Cartes',
      es: 'Quiz de los 50 Estados — Capitales, Banderas y Mapas', de: 'Quiz der 50 US-Bundesstaaten — Hauptstädte, Flaggen & Karten',
      pt: 'Quiz dos 50 Estados dos EUA — Capitais, Bandeiras e Mapas',
    },
    desc: {
      en: 'Periplo US States: learn all 50 US states, their capitals, flags and maps with fast, fun geography quizzes. Free to play.',
      fr: 'Periplo États-Unis : apprenez les 50 États américains, leurs capitales, drapeaux et cartes avec des quiz rapides et gratuits.',
      es: 'Periplo Estados Unidos: aprende los 50 estados de EE. UU., sus capitales, banderas y mapas con quizzes rápidos y gratuitos.',
      de: 'Periplo USA: Lerne alle 50 US-Bundesstaaten, ihre Hauptstädte, Flaggen und Karten mit schnellen, kostenlosen Quiz.',
      pt: 'Periplo Estados Unidos: aprenda os 50 estados dos EUA, suas capitais, bandeiras e mapas com quizzes rápidos e gratuitos.',
    },
  },
];

const UNIT_LABEL = {
  countries: { en: 'Countries', fr: 'Pays', es: 'Países', de: 'Länder', pt: 'Países' },
  states:    { en: 'States', fr: 'États', es: 'Estados', de: 'Bundesstaaten', pt: 'Estados' },
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function page(ed, lang) {
  const t = UI[lang];
  const name = ed.name[lang];
  const tagline = ed.tagline[lang];
  const desc = ed.desc[lang];
  const unitLabel = UNIT_LABEL[ed.unit][lang];
  const url = `${BASE_URL}/${lang}/${ed.slug}/`;
  const image = `${BASE_URL}/Assets/${encodeURIComponent(ed.folder)}/feature_graphic-1.png`;
  const getLink = `${BASE_URL}/get/?e=${ed.slug}&c=seo`;

  const hreflangs = LANGS.map((l) =>
    `  <link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}/${ed.slug}/">`).join('\n');
  const xDefault = `  <link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/${ed.slug}/">`;

  const langSwitcher = LANGS.filter((l) => l !== lang)
    .map((l) => `<a href="${BASE_URL}/${l}/${ed.slug}/">${LANG_NAMES[lang][l]}</a>`)
    .join(' · ');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} — ${esc(tagline)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${hreflangs}
${xDefault}

<meta property="og:type" content="website">
<meta property="og:title" content="${esc(name)} — ${esc(tagline)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">

<meta name="apple-itunes-app" content="app-id=${ed.iosId}, app-argument=${getLink}">

<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #0f1117; color: #fff;
    font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .hero {
    padding: 4.5rem 1.5rem 3.5rem; text-align: center;
    background: linear-gradient(155deg, ${ed.color1}33 0%, ${ed.color2}22 100%);
  }
  .logo { font-weight: 900; font-size: 1.1rem; opacity: .75; margin-bottom: 1.2rem; }
  h1 { font-size: clamp(1.8rem, 6vw, 2.6rem); font-weight: 900; margin: 0 0 .4rem; }
  .tagline { font-size: 1.05rem; opacity: .7; margin-bottom: 1.6rem; }
  .desc { max-width: 520px; margin: 0 auto 2rem; line-height: 1.6; opacity: .85; }
  .stats { display: flex; gap: 2rem; justify-content: center; margin-bottom: 2.2rem; }
  .stat-num { font-size: 1.8rem; font-weight: 800; color: ${ed.accent}; }
  .stat-lbl { font-size: .8rem; opacity: .6; }
  .btns { display: flex; flex-direction: column; gap: .8rem; max-width: 340px; margin: 0 auto; }
  .btn {
    display: flex; align-items: center; justify-content: center; gap: .5rem;
    padding: .9rem 1.1rem; border-radius: 12px; font-weight: 700; text-decoration: none;
    color: #fff; background: linear-gradient(135deg, ${ed.color1}, ${ed.color2});
  }
  .btn-ios { background: #1b1e27; border: 1px solid rgba(255,255,255,.15); }
  footer { text-align: center; padding: 2.5rem 1.5rem 3rem; font-size: .85rem; opacity: .6; }
  footer a { color: ${ed.accent}; text-decoration: none; }
  .langs { margin-top: .6rem; }
  .langs a { color: rgba(255,255,255,.55); margin: 0 .3rem; }
</style>
</head>
<body>
  <section class="hero">
    <div class="logo">Periplo</div>
    <h1>${esc(name)}</h1>
    <div class="tagline">${esc(tagline)}</div>
    <p class="desc">${esc(desc)}</p>
    <div class="stats">
      <div><div class="stat-num">${ed.stat}</div><div class="stat-lbl">${esc(unitLabel)}</div></div>
      <div><div class="stat-num">${ed.modes}</div><div class="stat-lbl">${esc(t.modesLabel)}</div></div>
      <div><div class="stat-num">${esc(t.free)}</div><div class="stat-lbl">&nbsp;</div></div>
    </div>
    <div class="btns">
      <a class="btn" href="${BASE_URL}/get/?e=${ed.slug}&c=seo_android">${esc(t.android)}</a>
      <a class="btn btn-ios" href="${BASE_URL}/get/?e=${ed.slug}&c=seo_ios">${esc(t.ios)}</a>
    </div>
  </section>
  <footer>
    <div><a href="${BASE_URL}/">${esc(t.allEditions)}</a></div>
    <div class="langs">${esc(t.alsoIn)} ${langSwitcher}</div>
  </footer>
</body>
</html>
`;
}

let count = 0;
for (const ed of EDITIONS) {
  for (const lang of LANGS) {
    const path = `${lang}/${ed.slug}/index.html`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, page(ed, lang), 'utf-8');
    count++;
  }
}
console.log(`Generated ${count} pages (${EDITIONS.length} editions x ${LANGS.length} languages).`);
