// Seed brand list (manual stage).
// `verified` lists which fields were checked against a public source.
// Anything not in `verified` is a placeholder that must be checked before launch.
// Items, prices, shipping and returns are DEMO values until the ingest script
// (scripts/ingest.mjs) replaces them with data pulled from each brand's store.

export const brands = [
  // ── Ukraine ─────────────────────────────────────────────
  {
    id: 'nofaith-studios', name: 'Nofaith Studios', country: 'UA', city: 'Kyiv', founded: null,
    style: ['streetwear', 'graphic'],
    description: {
      en: 'Ukrainian streetwear label with bold graphics, heavyweight hoodies and limited drops.',
      ru: 'Украинский стритвир-бренд: смелые принты, плотные худи и лимитированные дропы.',
    },
    website: null, instagram: null,
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 14 }, currency: 'UAH',
    palette: ['#1b1b1b', '#e8e2d6', '#c23b22'],
    verified: [],
  },
  {
    id: 'sndct-kyiv', name: 'SNDCT KYIV', country: 'UA', city: 'Kyiv', founded: null,
    style: ['streetwear', 'art collabs'],
    description: {
      en: 'Kyiv streetwear brand known for collaborations with Ukrainian artists, functional silhouettes and limited-edition drops.',
      ru: 'Киевский стритвир-бренд, известный коллаборациями с украинскими художниками, функциональным кроем и лимитированными дропами.',
    },
    website: null, instagram: null,
    shipping: ['UA', 'EU'], returns: { days: 14 }, currency: 'UAH',
    palette: ['#0e0e10', '#f2c94c', '#4b5563'],
    verified: ['description'],
  },
  {
    id: 'low-blow', name: 'Low Blow', country: 'UA', city: null, founded: null,
    style: ['skate', 'premium'],
    description: {
      en: 'Skate aesthetics combined with premium materials. Member of the SSWEEP alliance of Ukrainian streetwear brands.',
      ru: 'Скейт-эстетика и премиальные материалы. Участник SSWEEP — альянса украинских стритвир-брендов.',
    },
    website: null, instagram: null,
    shipping: ['UA'], returns: { days: 14 }, currency: 'UAH',
    palette: ['#2d3436', '#dfe6e9', '#00b894'],
    verified: ['description'],
  },
  {
    id: 'objectx', name: 'ObjectX', country: 'UA', city: null, founded: null,
    style: ['techwear', 'functional'],
    description: {
      en: 'Technology and functionality first: technical fabrics and utility details. SSWEEP alliance member.',
      ru: 'Технологичность и функциональность: технические ткани и утилитарные детали. Участник альянса SSWEEP.',
    },
    website: null, instagram: null,
    shipping: ['UA', 'EU'], returns: { days: 14 }, currency: 'UAH',
    palette: ['#111827', '#9ca3af', '#3b82f6'],
    verified: ['description'],
  },
  {
    id: 'unmere', name: 'Unmere', country: 'UA', city: null, founded: null,
    style: ['womenswear', 'minimal'],
    description: {
      en: 'Streetwear with femininity and sophistication. SSWEEP alliance member.',
      ru: 'Стритвир с женственностью и утончённостью. Участник альянса SSWEEP.',
    },
    website: null, instagram: null,
    shipping: ['UA'], returns: { days: 14 }, currency: 'UAH',
    palette: ['#f5ebe0', '#d5bdaf', '#6d597a'],
    verified: ['description'],
  },
  {
    id: 'vvhy-me', name: 'VVHY ME', country: 'UA', city: null, founded: null,
    style: ['lifestyle', 'streetwear'],
    description: {
      en: 'Ukrainian lifestyle streetwear brand. SSWEEP alliance member.',
      ru: 'Украинский lifestyle-стритвир. Участник альянса SSWEEP.',
    },
    website: null, instagram: null,
    shipping: ['UA', 'EU'], returns: { days: 14 }, currency: 'UAH',
    palette: ['#1d3557', '#f1faee', '#e63946'],
    verified: ['description'],
  },
  {
    id: 'ksenia-schnaider', name: 'Ksenia Schnaider', country: 'UA', city: 'Kyiv', founded: 2011,
    style: ['denim', 'upcycling'],
    description: {
      en: 'Kyiv label famous for upcycled and asymmetric denim and playful sportswear-inspired pieces.',
      ru: 'Киевский бренд, известный апсайкл- и асимметричным денимом и спортивными мотивами.',
    },
    website: 'https://kseniaschnaider.com', instagram: 'kseniaschnaider',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 14 }, currency: 'UAH',
    palette: ['#3a5a8c', '#c9d6ea', '#f4a261'],
    verified: ['name'],
  },
  {
    id: 'ienki-ienki', name: 'Ienki Ienki', country: 'UA', city: 'Kyiv', founded: 2016,
    style: ['outerwear', 'puffers'],
    description: {
      en: 'Ukrainian outerwear brand built around oversized, sculptural puffer jackets.',
      ru: 'Украинский бренд верхней одежды: объёмные скульптурные пуховики.',
    },
    website: 'https://ienkiienki.com', instagram: 'ienkiienki',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 14 }, currency: 'EUR',
    palette: ['#ff6b35', '#f7f7f2', '#2b2d42'],
    verified: ['name'],
  },

  // ── Europe ──────────────────────────────────────────────
  {
    id: 'corteiz', name: 'Corteiz', country: 'GB', city: 'London', founded: 2017,
    style: ['streetwear', 'hype'],
    description: {
      en: 'London streetwear brand with the Alcatraz logo, known for guerrilla-style drops and cargos.',
      ru: 'Лондонский стритвир с логотипом Alcatraz, известный партизанскими дропами и карго.',
    },
    website: 'https://www.crtz.xyz', instagram: 'corteiz',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'GBP',
    palette: ['#000000', '#ffffff', '#d90429'],
    verified: ['name'],
  },
  {
    id: 'represent', name: 'Represent', country: 'GB', city: 'Manchester', founded: 2011,
    style: ['luxury streetwear'],
    description: {
      en: 'Manchester label making elevated basics, heavyweight hoodies and the Owners Club line.',
      ru: 'Бренд из Манчестера: премиальные базовые вещи, плотные худи и линейка Owners Club.',
    },
    website: 'https://representclo.com', instagram: 'representclo',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 30 }, currency: 'GBP',
    palette: ['#2b2b2b', '#d6cfc4', '#7f6a55'],
    verified: ['name'],
  },
  {
    id: 'trapstar', name: 'Trapstar', country: 'GB', city: 'London', founded: 2005,
    style: ['streetwear', 'rap culture'],
    description: {
      en: 'West London brand rooted in rap culture, recognisable by its puffers and tracksuits.',
      ru: 'Бренд из Западного Лондона, связанный с рэп-культурой: пуховики и спортивные костюмы.',
    },
    website: 'https://uk.trapstarlondon.com', instagram: 'trapstarlondon',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'GBP',
    palette: ['#0b0b0b', '#b5b5b5', '#a4161a'],
    verified: ['name'],
  },
  {
    id: 'palace', name: 'Palace', country: 'GB', city: 'London', founded: 2009,
    style: ['skate'],
    description: {
      en: 'London skate brand with the Tri-Ferg logo and weekly seasonal drops.',
      ru: 'Лондонский скейт-бренд с логотипом Tri-Ferg и еженедельными дропами.',
    },
    website: 'https://www.palaceskateboards.com', instagram: 'palaceskateboards',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'GBP',
    palette: ['#ffffff', '#111111', '#2a9d8f'],
    verified: ['name'],
  },
  {
    id: 'aries', name: 'Aries', country: 'GB', city: 'London', founded: 2012,
    style: ['streetwear', 'graphic'],
    description: {
      en: 'London brand mixing graphic tees, distressed knitwear and a tongue-in-cheek attitude.',
      ru: 'Лондонский бренд: графичные футболки, состаренный трикотаж и ироничный подход.',
    },
    website: 'https://www.ariesarise.com', instagram: 'ariesarise',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'GBP',
    palette: ['#6a994e', '#f2e8cf', '#bc4749'],
    verified: ['name'],
  },
  {
    id: 'broken-planet', name: 'Broken Planet', country: 'GB', city: 'London', founded: 2020,
    style: ['streetwear', 'basics'],
    description: {
      en: 'London label with washed tracksuits and space-themed graphics.',
      ru: 'Лондонский бренд: варёные спортивные костюмы и космическая графика.',
    },
    website: 'https://brokenplanet.com', instagram: 'brokenplanet',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 14 }, currency: 'GBP',
    palette: ['#264653', '#e9c46a', '#e76f51'],
    verified: ['name'],
  },
  {
    id: 'places-faces', name: 'Places+Faces', country: 'GB', city: 'London', founded: 2014,
    style: ['streetwear', 'photo'],
    description: {
      en: 'Born as a photography project documenting youth culture, now a streetwear label.',
      ru: 'Вырос из фотопроекта о молодёжной культуре, теперь стритвир-бренд.',
    },
    website: 'https://www.placesplusfaces.com', instagram: 'placesplusfaces',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'GBP',
    palette: ['#ffbe0b', '#1a1a1a', '#fb5607'],
    verified: ['name'],
  },
  {
    id: 'daily-paper', name: 'Daily Paper', country: 'NL', city: 'Amsterdam', founded: 2012,
    style: ['streetwear', 'african heritage'],
    description: {
      en: 'Amsterdam brand inspired by African heritage, known for its shield logo.',
      ru: 'Амстердамский бренд, вдохновлённый африканским наследием, с узнаваемым логотипом-щитом.',
    },
    website: 'https://www.dailypaperclothing.com', instagram: 'dailypaper',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 30 }, currency: 'EUR',
    palette: ['#3d405b', '#f4f1de', '#e07a5f'],
    verified: ['name'],
  },
  {
    id: 'patta', name: 'Patta', country: 'NL', city: 'Amsterdam', founded: 2004,
    style: ['streetwear', 'sneaker culture'],
    description: {
      en: 'Amsterdam sneaker store turned brand, with deep roots in music and football culture.',
      ru: 'Амстердамский сникер-шоп, ставший брендом; корни в музыке и футбольной культуре.',
    },
    website: 'https://www.patta.nl', instagram: 'patta_nl',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 14 }, currency: 'EUR',
    palette: ['#003049', '#fcbf49', '#d62828'],
    verified: ['name'],
  },
  {
    id: 'pop-trading-company', name: 'Pop Trading Company', country: 'NL', city: 'Amsterdam', founded: 2009,
    style: ['skate', 'clean'],
    description: {
      en: 'Amsterdam skate brand with clean cuts and the "Miffy" collaborations.',
      ru: 'Амстердамский скейт-бренд с чистым кроем и коллаборациями с Miffy.',
    },
    website: 'https://poptradingcompany.com', instagram: 'poptradingcompany',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'EUR',
    palette: ['#8ecae6', '#023047', '#ffb703'],
    verified: ['name'],
  },
  {
    id: 'olaf-hussein', name: 'Olaf Hussein', country: 'NL', city: 'Amsterdam', founded: 2015,
    style: ['minimal', 'basics'],
    description: {
      en: 'Amsterdam label making minimal everyday pieces in muted tones.',
      ru: 'Амстердамский бренд минималистичной повседневной одежды в спокойных тонах.',
    },
    website: 'https://olafhussein.com', instagram: 'olafhussein',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 30 }, currency: 'EUR',
    palette: ['#d8e2dc', '#7d8597', '#212529'],
    verified: ['name'],
  },
  {
    id: 'arte-antwerp', name: 'Arte Antwerp', country: 'BE', city: 'Antwerp', founded: 2015,
    style: ['streetwear', 'art'],
    description: {
      en: 'Antwerp brand blending art references with everyday streetwear.',
      ru: 'Бренд из Антверпена, смешивающий отсылки к искусству и повседневный стритвир.',
    },
    website: 'https://arte-antwerp.com', instagram: 'arteantwerp',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'EUR',
    palette: ['#a8dadc', '#1d3557', '#e63946'],
    verified: ['name'],
  },
  {
    id: 'helas', name: 'Hélas', country: 'FR', city: 'Paris', founded: 2013,
    style: ['skate', 'caps'],
    description: {
      en: 'Paris skate brand that started with caps and grew into a full collection.',
      ru: 'Парижский скейт-бренд, начинавший с кепок и выросший в полноценную коллекцию.',
    },
    website: 'https://helascaps.com', instagram: 'helascaps',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'EUR',
    palette: ['#283618', '#fefae0', '#dda15e'],
    verified: ['name'],
  },
  {
    id: 'drole-de-monsieur', name: 'Drôle de Monsieur', country: 'FR', city: 'Paris', founded: 2017,
    style: ['streetwear', 'french'],
    description: {
      en: 'Paris brand with a "Not from Paris Madame" attitude and relaxed tailoring.',
      ru: 'Парижский бренд с настроением «Not from Paris Madame» и расслабленным кроем.',
    },
    website: 'https://drolemonsieur.com', instagram: 'drolemonsieur',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 14 }, currency: 'EUR',
    palette: ['#f8f9fa', '#343a40', '#c9184a'],
    verified: ['name'],
  },
  {
    id: 'carhartt-wip', name: 'Carhartt WIP', country: 'DE', city: 'Weil am Rhein', founded: 1989,
    style: ['workwear', 'streetwear'],
    description: {
      en: 'European "Work In Progress" line of Carhartt, reworking workwear for streetwear.',
      ru: 'Европейская линия Carhartt «Work In Progress»: рабочая одежда в стритвир-подаче.',
    },
    website: 'https://www.carhartt-wip.com', instagram: 'carharttwip',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 30 }, currency: 'EUR',
    palette: ['#bc6c25', '#fefae0', '#283618'],
    verified: ['name'],
  },
  {
    id: 'wood-wood', name: 'Wood Wood', country: 'DK', city: 'Copenhagen', founded: 2002,
    style: ['streetwear', 'scandi'],
    description: {
      en: 'Copenhagen brand bridging streetwear, sportswear and Scandinavian design.',
      ru: 'Копенгагенский бренд на стыке стритвира, спортивной одежды и скандинавского дизайна.',
    },
    website: 'https://www.woodwood.com', instagram: 'woodwood',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 30 }, currency: 'EUR',
    palette: ['#e9edc9', '#588157', '#344e41'],
    verified: ['name'],
  },
  {
    id: 'axel-arigato', name: 'Axel Arigato', country: 'SE', city: 'Stockholm', founded: 2014,
    style: ['sneakers', 'minimal'],
    description: {
      en: 'Stockholm brand best known for minimal sneakers, now a full ready-to-wear line.',
      ru: 'Стокгольмский бренд, известный минималистичными кедами, теперь и полноценная одежда.',
    },
    website: 'https://axelarigato.com', instagram: 'axelarigato',
    shipping: ['UA', 'EU', 'WORLD'], returns: { days: 30 }, currency: 'EUR',
    palette: ['#ffffff', '#adb5bd', '#212529'],
    verified: ['name'],
  },
  {
    id: 'our-legacy', name: 'Our Legacy', country: 'SE', city: 'Stockholm', founded: 2005,
    style: ['minimal', 'menswear'],
    description: {
      en: 'Stockholm label with unusual fabrics, relaxed shapes and the WORK SHOP upcycling line.',
      ru: 'Стокгольмский бренд с необычными тканями, свободным кроем и апсайкл-линией WORK SHOP.',
    },
    website: 'https://www.ourlegacy.com', instagram: 'ourlegacy',
    shipping: ['EU', 'WORLD'], returns: { days: 14 }, currency: 'EUR',
    palette: ['#cdb4db', '#3c3c3c', '#ffc8dd'],
    verified: ['name'],
  },
];

export const countries = {
  UA: { en: 'Ukraine', ru: 'Украина', flag: '🇺🇦' },
  GB: { en: 'United Kingdom', ru: 'Великобритания', flag: '🇬🇧' },
  NL: { en: 'Netherlands', ru: 'Нидерланды', flag: '🇳🇱' },
  BE: { en: 'Belgium', ru: 'Бельгия', flag: '🇧🇪' },
  FR: { en: 'France', ru: 'Франция', flag: '🇫🇷' },
  DE: { en: 'Germany', ru: 'Германия', flag: '🇩🇪' },
  DK: { en: 'Denmark', ru: 'Дания', flag: '🇩🇰' },
  SE: { en: 'Sweden', ru: 'Швеция', flag: '🇸🇪' },
};
