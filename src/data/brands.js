// Brand list (manual stage): picked from the owner's own follow list, Ukrainian and European only.
// Facts here were checked against each brand's store on `checkedAt`. Country, city, currency
// and ships-to come from the store itself at every ingest (src/data/generated/stores.json)
// and override the fallbacks below. `returns` is null until read from the store's policy.
const base = { shipping: ['EU'], returns: null, currency: 'EUR', founded: null, verified: ['name', 'website', 'instagram', 'description'], checkedAt: '2026-11-14' };

export const brands = [
  {
    ...base, id: 'antisocial-laboratory', name: 'Antisocial Laboratory', country: 'UA', city: 'Kyiv',
    style: ['streetwear'],
    description: { en: 'Independent streetwear label from Kyiv with its own online store and small drops.', ru: 'Независимый стритвир-бренд из Киева с собственным онлайн-магазином и небольшими дропами.', uk: 'Незалежний стрітвір-бренд із Києва з власним онлайн-магазином і невеликими дропами.' },
    website: 'https://antisocialaboratory.online', instagram: 'antisocialaboratory', currency: 'UAH', shipping: ['UA', 'EU', 'WORLD'],
  },
  {
    ...base, id: 'fwwproject', name: 'fwwproject', country: 'UA', city: 'Kyiv',
    style: ['streetwear'],
    description: { en: 'Small independent clothing project from Kyiv.', ru: 'Небольшой независимый проект одежды из Киева.', uk: 'Невеликий незалежний проєкт одягу з Києва.' },
    website: 'https://fwwpjct.com', instagram: 'fwwpjct', currency: 'USD',
  },
  {
    ...base, id: 'nofaith-studios', name: 'No/Faith Studios', country: 'DE', city: 'Cologne', founded: 2017,
    style: ['denim', 'leather', 'streetwear'],
    description: {
      en: 'Young independent brand founded in 2017 by Luis Dobbelgarten in a bedroom in the Eifel, starting with printed shirts and reworked hoodies. Today a small team between the Eifel, Berlin and Paris, specialised in denim; leather goods and footwear are made in Italy.',
      ru: 'Молодой независимый бренд, основанный в 2017 году Луисом Доббельгартеном в спальне в Айфеле: всё началось с футболок с принтами и переделанных худи. Сейчас это небольшая команда между Айфелем, Берлином и Парижем, специализация бренда — деним; кожаные вещи и обувь шьют в Италии.', uk: 'Молодий незалежний бренд, заснований 2017 року Луїсом Доббельгартеном у спальні в Айфелі: усе почалося з футболок із принтами та перешитих худі. Сьогодні це невелика команда між Айфелем, Берліном і Парижем, спеціалізація бренду — денім; шкіряні речі та взуття шиють в Італії.',
    },
    website: 'https://nofaithstudios.com', instagram: 'nofaithstudios', shipping: ['WORLD'], returns: { days: 14 },
    shippingNote: {
      en: 'Worldwide with DHL. Orders leave in 3–5 business days; leather jackets ship 4 weeks after purchase. Outside the EU customs duties may apply.',
      ru: 'По всему миру через DHL. Отправка за 3–5 рабочих дней; кожаные куртки отправляют через 4 недели после покупки. За пределами ЕС возможны таможенные платежи.', uk: 'По всьому світу через DHL. Відправлення за 3–5 робочих днів; шкіряні куртки надсилають через 4 тижні після покупки. За межами ЄС можливі митні платежі.',
    },
    returnsNote: {
      en: 'EU only, through the return portal; return shipping is paid by the customer. Outside the EU: defective items only.',
      ru: 'Только для ЕС, через портал возвратов; обратную доставку оплачивает покупатель. За пределами ЕС возврат только при браке.', uk: 'Лише для ЄС, через портал повернень; зворотну доставку оплачує покупець. За межами ЄС повернення лише в разі браку.',
    },
    verified: ['name', 'description', 'website', 'instagram', 'shipping', 'returns'],
  },
  {
    ...base, id: 'society-de-nobodies', name: 'Society De Nobodies', country: 'DE', city: 'Cologne',
    style: ['streetwear'],
    description: { en: 'Young independent brand based in Cologne, Germany.', ru: 'Молодой независимый бренд из Кёльна, Германия.', uk: 'Молодий незалежний бренд із Кельна, Німеччина.' },
    website: 'https://societydenobodies.com', instagram: 'society.de.nobodies',
  },
  {
    ...base, id: 'club-de-presage', name: 'club de présage', country: 'DE', city: 'Dreieich',
    style: ['streetwear'],
    description: { en: 'German streetwear brand focused on high quality and statement pieces.', ru: 'Немецкий стритвир-бренд с упором на качество и вещи-высказывания.', uk: 'Німецький стрітвір-бренд з акцентом на якість і речі-висловлювання.' },
    website: 'https://clubpresage.com', instagram: 'clubpresage',
  },
  {
    ...base, id: 'divention', name: 'Divention', country: 'DE', city: 'Bergheim',
    style: ['streetwear', 'extravagant'],
    description: { en: 'German label where streetwear meets extravagance.', ru: 'Немецкий бренд на стыке стритвира и экстравагантности.', uk: 'Німецький бренд на межі стрітвіру та екстравагантності.' },
    website: 'https://divention.de', instagram: 'divention',
  },
  {
    ...base, id: 'obvune', name: 'Obvune', country: 'DE', city: 'Völklingen',
    style: ['handmade'],
    description: { en: 'Handmade fashion from Germany.', ru: 'Одежда ручной работы из Германии.', uk: 'Одяг ручної роботи з Німеччини.' },
    website: 'https://obvune.com', instagram: 'obvune',
  },
  {
    ...base, id: '2819-jewelry', name: '2819 Jewelry', country: 'DE', city: 'Leipzig',
    style: ['jewelry', 'brutalist'],
    description: { en: 'Brutalist jewelry pieces from Leipzig.', ru: 'Украшения в бруталистской эстетике из Лейпцига.', uk: 'Прикраси в бруталістській естетиці з Лейпцига.' },
    website: 'https://2819jewelry.de', instagram: '2819jewelry',
  },
  {
    ...base, id: 'scuffers', name: 'Scuffers', country: 'ES', city: 'Madrid',
    style: ['streetwear', 'everyday'],
    description: { en: 'Spanish brand with the motto “Everyday Urban Aesthetics”: hoodies, knitwear and relaxed basics.', ru: 'Испанский бренд с девизом «Everyday Urban Aesthetics»: худи, трикотаж и расслабленная база.', uk: 'Іспанський бренд із девізом «Everyday Urban Aesthetics»: худі, трикотаж і розслаблена база.' },
    website: 'https://scuffers.com', instagram: 'scuffers.co',
  },
  {
    ...base, id: 'racer-worldwide', name: 'Racer Worldwide', country: 'EE', city: 'Tallinn',
    style: ['denim', 'jackets', 'ready-to-wear'],
    description: { en: 'Ready-to-wear label from Tallinn known for its jackets and denim.', ru: 'Бренд из Таллина, известный куртками и денимом.', uk: 'Бренд із Таллінна, відомий куртками та денімом.' },
    website: 'https://racerworldwide.net', instagram: 'racerworldwide',
  },
  {
    ...base, id: 'lomalab', name: 'Lomalab', country: 'IT', city: 'Rome',
    style: ['streetwear', 'handcrafted'],
    description: { en: 'Everyday streetwear ethically handcrafted in Italy.', ru: 'Повседневный стритвир, этично сшитый вручную в Италии.', uk: 'Повсякденний стрітвір, етично пошитий вручну в Італії.' },
    website: 'https://lomalab.store', instagram: 'lomalab.store',
  },
  {
    ...base, id: 'lkc2000', name: 'LKC2000', country: 'PL', city: 'Warsaw',
    style: ['streetwear'],
    description: { en: 'Lost Kids Club 2000, an independent streetwear label from Warsaw.', ru: 'Lost Kids Club 2000, независимый стритвир-бренд из Варшавы.', uk: 'Lost Kids Club 2000, незалежний стрітвір-бренд із Варшави.' },
    website: 'https://lostkidsclub2000.com', instagram: 'lostkidsclub2000',
  },
  {
    ...base, id: 'jaded-london', name: 'Jaded London', country: 'GB', city: 'London',
    style: ['streetwear', 'trend'],
    description: { en: 'London brand with globally inspired street style and bold, trend-led pieces.', ru: 'Лондонский бренд: уличный стиль с мировыми влияниями и смелые трендовые вещи.', uk: 'Лондонський бренд: вуличний стиль зі світовими впливами та сміливі трендові речі.' },
    website: 'https://jadedman.com', instagram: 'jaded_man', currency: 'GBP',
  },
  {
    ...base, id: 'undersoul', name: 'Undersoul', country: 'GB', city: 'Cheadle',
    style: ['streetwear'],
    description: { en: 'Independent streetwear label from the UK.', ru: 'Независимый стритвир-бренд из Великобритании.', uk: 'Незалежний стрітвір-бренд із Великої Британії.' },
    website: 'https://undersoulwear.com', instagram: 'undersoulwear', currency: 'USD',
  },
  {
    ...base, id: 'monateo', name: 'monateo', country: 'FR', city: 'Paris',
    style: ['jewelry'],
    description: { en: 'Jewelry label from Paris.', ru: 'Бренд украшений из Парижа.', uk: 'Бренд прикрас із Парижа.' },
    website: 'https://monateo.com', instagram: 'monateo.paris',
  },
];

export const countries = {
  UA: { en: 'Ukraine', ru: 'Украина', uk: 'Україна' },
  DE: { en: 'Germany', ru: 'Германия', uk: 'Німеччина' },
  ES: { en: 'Spain', ru: 'Испания', uk: 'Іспанія' },
  EE: { en: 'Estonia', ru: 'Эстония', uk: 'Естонія' },
  IT: { en: 'Italy', ru: 'Италия', uk: 'Італія' },
  PL: { en: 'Poland', ru: 'Польша', uk: 'Польща' },
  GB: { en: 'United Kingdom', ru: 'Великобритания', uk: 'Велика Британія' },
  FR: { en: 'France', ru: 'Франция', uk: 'Франція' },
};
