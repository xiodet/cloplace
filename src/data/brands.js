// Brand list (manual stage): picked from the owner's own follow list, Ukrainian and European only.
// Facts here were checked against each brand's store on `checkedAt`. Country, city, currency
// and ships-to come from the store itself at every ingest (src/data/generated/stores.json)
// and override the fallbacks below. `returns` is null until read from the store's policy.
const base = { shipping: ['EU'], returns: null, currency: 'EUR', founded: null, verified: ['name', 'website', 'instagram', 'description'], checkedAt: '2026-11-14' };

const found = { ...base, verified: ['name', 'website'] };

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
  // ── Researched on 2026-11-14: European labels of the same kind with their own stores.
  //    Description is a neutral summary of how the store presents itself; Instagram not filled in yet.
  {
    ...found, id: "6pm", name: "6PM", country: 'DE', city: "Frankfurt",
    style: ["streetwear"],
    description: { en: "Premium streetwear designed in Germany, based in Frankfurt.", ru: "Премиальный стритвир, придуманный в Германии. Бренд из Франкфурта.", uk: "Преміальний стрітвір, створений у Німеччині. Бренд із Франкфурта." },
    website: 'https://6pmseason.com', instagram: null,
  },
  {
    ...found, id: "arte-antwerp", name: "Arte Antwerp", country: 'BE', city: "Antwerp",
    style: ["menswear", "streetwear"],
    description: { en: "Antwerp-based clothing label making premium menswear.", ru: "Бренд одежды из Антверпена, премиальная мужская одежда.", uk: "Бренд одягу з Антверпена, преміальний чоловічий одяг." },
    website: 'https://arte-antwerp.com', instagram: null,
  },
  {
    ...found, id: "avnier", name: "Avnier", country: 'FR', city: "Paris",
    style: ["streetwear", "functional"],
    description: { en: "Paris label making functional, durable clothing and accessories.", ru: "Парижский бренд функциональной и долговечной одежды и аксессуаров.", uk: "Паризький бренд функціонального й довговічного одягу та аксесуарів." },
    website: 'https://avnier.com', instagram: null,
  },
  {
    ...found, id: "bluemarble", name: "Bluemarble", country: 'FR', city: "Paris",
    style: ["menswear"],
    description: { en: "French menswear brand created by Anthony Alvarez, based in Paris.", ru: "Французский бренд мужской одежды, созданный Энтони Альваресом. Базируется в Париже.", uk: "Французький бренд чоловічого одягу, створений Ентоні Альваресом. Базується в Парижі." },
    website: 'https://bluemarbleparis.com', instagram: null,
  },
  {
    ...found, id: "carne-bollente", name: "Carne Bollente", country: 'FR', city: "Paris",
    style: ["streetwear", "embroidery"],
    description: { en: "Paris label known for playful embroidered pieces about the joy of sexuality.", ru: "Парижский бренд, известный игривыми вещами с вышивкой на тему сексуальности.", uk: "Паризький бренд, відомий грайливими речами з вишивкою на тему сексуальності." },
    website: 'https://carnebollente.com', instagram: null,
  },
  {
    ...found, id: "cole-buxton", name: "Cole Buxton", country: 'GB', city: "London",
    style: ["sportswear", "essentials"],
    description: { en: "London-based luxury sportswear brand focused on daily essentials.", ru: "Лондонский бренд люксовой спортивной одежды с упором на базовые вещи.", uk: "Лондонський бренд люксового спортивного одягу з акцентом на базові речі." },
    website: 'https://colebuxton.com', instagram: null, currency: 'GBP',
  },
  {
    ...found, id: "dont-waste-culture", name: "Don't Waste Culture", country: 'NL', city: "Apeldoorn",
    style: ["streetwear"],
    description: { en: "Independent fashion label from the Netherlands that tells stories through its collections.", ru: "Независимый бренд из Нидерландов, который рассказывает истории через свои коллекции.", uk: "Незалежний бренд із Нідерландів, що розповідає історії через свої колекції." },
    website: 'https://dontwasteculture.com', instagram: null,
  },
  {
    ...found, id: "doomsday", name: "Doomsday Co", country: 'GB', city: "Hereford",
    style: ["streetwear", "graphic"],
    description: { en: "Streetwear label from Hereford, UK.", ru: "Стритвир-бренд из Херефорда, Великобритания.", uk: "Стрітвір-бренд із Герефорда, Велика Британія." },
    website: 'https://doomsdayco.com', instagram: null, currency: 'GBP',
  },
  {
    ...found, id: "drole-de-monsieur", name: "Drôle de Monsieur", country: 'FR', city: "Paris",
    style: ["menswear", "retro"],
    description: { en: "French menswear brand blending retro inspirations with tailoring and sportswear.", ru: "Французский бренд мужской одежды: ретро-вдохновение, костюмный крой и спортивные вещи.", uk: "Французький бренд чоловічого одягу: ретро-натхнення, костюмний крій і спортивні речі." },
    website: 'https://droledemonsieur.com', instagram: null,
  },
  {
    ...found, id: "edmmond-studios", name: "Edmmond Studios", country: 'ES', city: "Madrid",
    style: ["casual", "menswear"],
    description: { en: "Fashion brand based in Madrid, founded in 2014.", ru: "Бренд одежды из Мадрида, основан в 2014 году.", uk: "Бренд одягу з Мадрида, заснований 2014 року." },
    website: 'https://edmmond.com', instagram: null,
  },
  {
    ...found, id: "eightyfive", name: "Eightyfive", country: 'DE', city: "Hannover",
    style: ["streetwear"],
    description: { en: "Streetwear label from Hannover with worldwide shipping.", ru: "Стритвир-бренд из Ганновера с доставкой по всему миру.", uk: "Стрітвір-бренд із Ганновера з доставкою по всьому світу." },
    website: 'https://eightyfiveclo.com', instagram: null,
  },
  {
    ...found, id: "garment-workshop", name: "Garment Workshop", country: 'IT', city: "Rome",
    style: ["streetwear", "made in Italy"],
    description: { en: "Made-in-Italy apparel from Rome with a transparent production chain.", ru: "Одежда, сшитая в Италии, из Рима, с прозрачной цепочкой производства.", uk: "Одяг, пошитий в Італії, з Рима, із прозорим ланцюжком виробництва." },
    website: 'https://garmentworkshop.com', instagram: null,
  },
  {
    ...found, id: "grimey", name: "Grimey", country: 'ES', city: "Madrid",
    style: ["streetwear"],
    description: { en: "One of Spain's best-known streetwear brands, based near Madrid.", ru: "Один из самых известных стритвир-брендов Испании, базируется под Мадридом.", uk: "Один із найвідоміших стрітвір-брендів Іспанії, базується під Мадридом." },
    website: 'https://grimey.com', instagram: null,
  },
  {
    ...found, id: "house-of-errors", name: "House of Errors", country: 'GB', city: "London",
    style: ["streetwear", "experimental"],
    description: { en: "Independent London label with experimental streetwear.", ru: "Независимый лондонский бренд с экспериментальным стритвиром.", uk: "Незалежний лондонський бренд з експериментальним стрітвіром." },
    website: 'https://houseoferrors.org', instagram: null, currency: 'GBP',
  },
  {
    ...found, id: "iuter", name: "Iuter", country: 'IT', city: "Milan",
    style: ["streetwear"],
    description: { en: "Streetwear brand from Milan.", ru: "Стритвир-бренд из Милана.", uk: "Стрітвір-бренд із Мілана." },
    website: 'https://iuter.com', instagram: null,
  },
  {
    ...found, id: "kaotiko", name: "Kaotiko", country: 'ES', city: "Barcelona",
    style: ["streetwear", "urban"],
    description: { en: "Urban fashion brand from the Barcelona area: hoodies, tees and more.", ru: "Бренд городской моды из окрестностей Барселоны: худи, футболки и не только.", uk: "Бренд міської моди з околиць Барселони: худі, футболки й не лише." },
    website: 'https://kaotikobcn.com', instagram: null,
  },
  {
    ...found, id: "low-lights-studios", name: "Low Lights Studios", country: 'DE', city: "Ratingen",
    style: ["streetwear"],
    description: { en: "Independent streetwear label from Germany.", ru: "Независимый стритвир-бренд из Германии.", uk: "Незалежний стрітвір-бренд із Німеччини." },
    website: 'https://lowlightsstudios.com', instagram: null,
  },
  {
    ...found, id: "misbhv", name: "MISBHV", country: 'PL', city: "Kraków",
    style: ["fashion", "club culture"],
    description: { en: "Polish fashion label from Kraków with roots in club culture.", ru: "Польский модный бренд из Кракова с корнями в клубной культуре.", uk: "Польський модний бренд із Кракова з корінням у клубній культурі." },
    website: 'https://misbhv.com', instagram: null, currency: 'PLN',
  },
  {
    ...found, id: "mki-miyuki-zoku", name: "MKI Miyuki Zoku", country: 'GB', city: "Leeds",
    style: ["menswear", "lifestyle"],
    description: { en: "Contemporary menswear and lifestyle brand from Leeds.", ru: "Современный бренд мужской одежды и лайфстайла из Лидса.", uk: "Сучасний бренд чоловічого одягу та лайфстайлу з Лідса." },
    website: 'https://mkistore.co.uk', instagram: null, currency: 'GBP',
  },
  {
    ...found, id: "more-money-more-love", name: "More Money More Love", country: 'DE', city: "Düsseldorf",
    style: ["streetwear"],
    description: { en: "Premium streetwear from Germany with bold, limited drops.", ru: "Премиальный стритвир из Германии со смелыми лимитированными дропами.", uk: "Преміальний стрітвір із Німеччини зі сміливими лімітованими дропами." },
    website: 'https://moremoneymorelove.de', instagram: null,
  },
  {
    ...found, id: "named-collective", name: "Named Collective", country: 'GB', city: "London",
    style: ["streetwear", "unisex"],
    description: { en: "London label making unisex pieces in small, limited runs.", ru: "Лондонский бренд, выпускающий унисекс-вещи небольшими лимитированными партиями.", uk: "Лондонський бренд, що випускає унісекс-речі невеликими лімітованими партіями." },
    website: 'https://namedcollective.com', instagram: null, currency: 'GBP',
  },
  {
    ...found, id: "nude-project", name: "Nude Project", country: 'ES', city: "Barcelona",
    style: ["streetwear"],
    description: { en: "Ready-to-wear label founded in 2018 in a small dorm room, now based in Barcelona.", ru: "Бренд готовой одежды, основанный в 2018 году в комнате общежития. Сейчас базируется в Барселоне.", uk: "Бренд готового одягу, заснований 2018 року в кімнаті гуртожитку. Нині базується в Барселоні." },
    website: 'https://nude-project.com', instagram: null,
  },
  {
    ...found, id: "octopus", name: "Octopus", country: 'IT', city: "Milan",
    style: ["streetwear", "graphic"],
    description: { en: "Milan brand that has been spreading its octopus motif since 2006.", ru: "Миланский бренд, который с 2006 года развивает свой мотив с осьминогом.", uk: "Міланський бренд, який із 2006 року розвиває свій мотив із восьминогом." },
    website: 'https://octopusbrand.com', instagram: null,
  },
  {
    ...found, id: "pegador", name: "Pegador", country: 'DE', city: "Emsdetten",
    style: ["streetwear", "oversized"],
    description: { en: "Streetwear from Germany: oversized hoodies, tees and sweatpants.", ru: "Стритвир из Германии: оверсайз-худи, футболки и спортивные штаны.", uk: "Стрітвір із Німеччини: оверсайз-худі, футболки та спортивні штани." },
    website: 'https://pegador.com', instagram: null,
  },
  {
    ...found, id: "peso", name: "Peso", country: 'DE', city: "Düsseldorf",
    style: ["streetwear", "basics"],
    description: { en: "Düsseldorf label with high-quality basics and seasonal collections.", ru: "Бренд из Дюссельдорфа: качественная база и сезонные коллекции.", uk: "Бренд із Дюссельдорфа: якісна база та сезонні колекції." },
    website: 'https://pesoclo.com', instagram: null,
  },
  {
    ...found, id: "reternity", name: "Reternity", country: 'DE', city: "Delmenhorst",
    style: ["streetwear"],
    description: { en: "Luxury streetwear from Germany.", ru: "Люксовый стритвир из Германии.", uk: "Люксовий стрітвір із Німеччини." },
    website: 'https://reternity.de', instagram: null,
  },
  {
    ...found, id: "trendt-vision", name: "Trendt Vision", country: 'DE', city: "Hamburg",
    style: ["streetwear"],
    description: { en: "Streetwear brand from the Hamburg area: hoodies, tees and sweaters.", ru: "Стритвир-бренд из окрестностей Гамбурга: худи, футболки и свитшоты.", uk: "Стрітвір-бренд з околиць Гамбурга: худі, футболки та світшоти." },
    website: 'https://trendtvision.com', instagram: null,
  },
  {
    ...found, id: "wrstbhvr", name: "WRSTBHVR", country: 'DE', city: "Berlin",
    style: ["streetwear"],
    description: { en: "Berlin streetwear label for women and men.", ru: "Берлинский стритвир-бренд для женщин и мужчин.", uk: "Берлінський стрітвір-бренд для жінок і чоловіків." },
    website: 'https://wrstbhvr.com', instagram: null,
  },
  {
    ...found, id: "riot-division", name: "Riot Division", country: 'UA', city: "Kyiv",
    style: ["techwear", "streetwear"],
    description: { en: "Kyiv label making technical, transformable urban clothing.", ru: "Киевский бренд технологичной городской одежды-трансформера.", uk: "Київський бренд технологічного міського одягу-трансформера." },
    website: 'https://riotdivision.tech', instagram: null, currency: 'USD',
  },
  {
    ...found, id: "ksenia-schnaider", name: "Ksenia Schnaider", country: 'UA', city: "Kyiv",
    style: ["denim", "upcycling"],
    description: { en: "Ukrainian brand known for reworked denim and upcycling.", ru: "Украинский бренд, известный переработанным денимом и апсайклингом.", uk: "Український бренд, відомий переробленим денімом та апсайклінгом." },
    website: 'https://kseniaschnaider.com', instagram: null, currency: 'UAH',
  },
  {
    ...found, id: "ienki-ienki", name: "Ienki Ienki", country: 'UA', city: "Kyiv",
    style: ["outerwear", "puffers"],
    description: { en: "Ukrainian outerwear brand known for its puffer jackets.", ru: "Украинский бренд верхней одежды, известный своими пуховиками.", uk: "Український бренд верхнього одягу, відомий своїми пуховиками." },
    website: 'https://ienki-ienki.com', instagram: null, currency: 'EUR',
  },
  {
    ...found, id: "represent", name: "Represent", country: 'GB', city: "Manchester",
    style: ["streetwear", "luxury"],
    description: { en: "British luxury streetwear brand from the Manchester area.", ru: "Британский бренд люксового стритвира из окрестностей Манчестера.", uk: "Британський бренд люксового стрітвіру з околиць Манчестера." },
    website: 'https://uk.representclo.com', instagram: null, currency: 'GBP',
  },
  {
    ...found, id: "filling-pieces", name: "Filling Pieces", country: 'NL', city: "Amsterdam",
    style: ["footwear", "streetwear"],
    description: { en: "Amsterdam brand bridging the gap between streetwear and high fashion.", ru: "Амстердамский бренд на стыке стритвира и высокой моды.", uk: "Амстердамський бренд на межі стрітвіру та високої моди." },
    website: 'https://fillingpieces.com', instagram: null,
  },
  {
    ...found, id: "olaf-hussein", name: "OLAF", country: 'NL', city: "Amsterdam",
    style: ["menswear", "streetwear"],
    description: { en: "Amsterdam label inspired by countries, cultures and citizens.", ru: "Амстердамский бренд, вдохновлённый странами, культурами и людьми.", uk: "Амстердамський бренд, натхненний країнами, культурами та людьми." },
    website: 'https://olafhussein.com', instagram: null,
  },
  {
    ...found, id: "patta", name: "Patta", country: 'NL', city: "Amsterdam",
    style: ["streetwear"],
    description: { en: "Amsterdam streetwear brand, started \"out of love and necessity\".", ru: "Амстердамский стритвир-бренд, созданный «из любви и необходимости».", uk: "Амстердамський стрітвір-бренд, створений «з любові та необхідності»." },
    website: 'https://patta.nl', instagram: null,
  },
  {
    ...found, id: "the-new-originals", name: "The New Originals", country: 'NL', city: "Amsterdam",
    style: ["performance", "streetwear"],
    description: { en: "Amsterdam label making performance clothing for thinkers, makers and doers.", ru: "Амстердамский бренд функциональной одежды для тех, кто думает, создаёт и делает.", uk: "Амстердамський бренд функціонального одягу для тих, хто думає, створює і робить." },
    website: 'https://theneworiginals.eu', instagram: null,
  },
  {
    ...found, id: "black-bananas", name: "Black Bananas", country: 'NL', city: "The Hague",
    style: ["streetwear"],
    description: { en: "Dutch streetwear brand from The Hague.", ru: "Нидерландский стритвир-бренд из Гааги.", uk: "Нідерландський стрітвір-бренд із Гааги." },
    website: 'https://blackbananas.com', instagram: null,
  },
  {
    ...found, id: "polar-skate-co", name: "Polar Skate Co.", country: 'SE', city: "Malmö",
    style: ["skate"],
    description: { en: "Skateboard company from Malmö known for its wide-leg jeans.", ru: "Скейтерский бренд из Мальмё, известный широкими джинсами.", uk: "Скейтерський бренд із Мальме, відомий широкими джинсами." },
    website: 'https://polarskateco.com', instagram: null,
  },
  {
    ...found, id: "soulland", name: "Soulland", country: 'DK', city: "Copenhagen",
    style: ["menswear", "streetwear"],
    description: { en: "Copenhagen fashion brand with seasonal collections.", ru: "Копенгагенский модный бренд с сезонными коллекциями.", uk: "Копенгагенський модний бренд із сезонними колекціями." },
    website: 'https://soulland.com', instagram: null,
  },
  {
    ...found, id: "eytys", name: "Eytys", country: 'SE', city: "Stockholm",
    style: ["footwear", "denim"],
    description: { en: "Stockholm brand refining classics: chunky footwear and denim.", ru: "Стокгольмский бренд, переосмысляющий классику: массивная обувь и деним.", uk: "Стокгольмський бренд, що переосмислює класику: масивне взуття та денім." },
    website: 'https://eytys.com', instagram: null, currency: 'SEK',
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
  BE: { en: 'Belgium', ru: 'Бельгия', uk: 'Бельгія' },
  SE: { en: 'Sweden', ru: 'Швеция', uk: 'Швеція' },
  DK: { en: 'Denmark', ru: 'Дания', uk: 'Данія' },
  NL: { en: 'Netherlands', ru: 'Нидерланды', uk: 'Нідерланди' },
};
