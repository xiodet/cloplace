// Where a visitor might be: country code → a reference point [lon, lat] (the capital) and
// the browser time zones that suggest it. Used only for rough delivery estimates on the map.
export const places = {
  UA: { geo: [30.52, 50.45], tz: ['Europe/Kyiv', 'Europe/Kiev', 'Europe/Uzhgorod', 'Europe/Zaporozhye'] },
  PL: { geo: [21.01, 52.23], tz: ['Europe/Warsaw'] },
  DE: { geo: [13.4, 52.52], tz: ['Europe/Berlin', 'Europe/Busingen'] },
  FR: { geo: [2.35, 48.86], tz: ['Europe/Paris'] },
  ES: { geo: [-3.7, 40.42], tz: ['Europe/Madrid'] },
  IT: { geo: [12.5, 41.9], tz: ['Europe/Rome'] },
  GB: { geo: [-0.13, 51.51], tz: ['Europe/London'] },
  NL: { geo: [4.9, 52.37], tz: ['Europe/Amsterdam'] },
  BE: { geo: [4.35, 50.85], tz: ['Europe/Brussels'] },
  AT: { geo: [16.37, 48.21], tz: ['Europe/Vienna'] },
  CH: { geo: [8.54, 47.38], tz: ['Europe/Zurich'] },
  CZ: { geo: [14.44, 50.08], tz: ['Europe/Prague'] },
  SK: { geo: [17.11, 48.15], tz: ['Europe/Bratislava'] },
  HU: { geo: [19.04, 47.5], tz: ['Europe/Budapest'] },
  RO: { geo: [26.1, 44.43], tz: ['Europe/Bucharest'] },
  BG: { geo: [23.32, 42.7], tz: ['Europe/Sofia'] },
  GR: { geo: [23.73, 37.98], tz: ['Europe/Athens'] },
  HR: { geo: [15.98, 45.81], tz: ['Europe/Zagreb'] },
  SI: { geo: [14.51, 46.06], tz: ['Europe/Ljubljana'] },
  RS: { geo: [20.46, 44.79], tz: ['Europe/Belgrade'] },
  MD: { geo: [28.86, 47.01], tz: ['Europe/Chisinau'] },
  PT: { geo: [-9.14, 38.72], tz: ['Europe/Lisbon'] },
  IE: { geo: [-6.26, 53.35], tz: ['Europe/Dublin'] },
  DK: { geo: [12.57, 55.68], tz: ['Europe/Copenhagen'] },
  SE: { geo: [18.07, 59.33], tz: ['Europe/Stockholm'] },
  NO: { geo: [10.75, 59.91], tz: ['Europe/Oslo'] },
  FI: { geo: [24.94, 60.17], tz: ['Europe/Helsinki'] },
  EE: { geo: [24.75, 59.44], tz: ['Europe/Tallinn'] },
  LV: { geo: [24.11, 56.95], tz: ['Europe/Riga'] },
  LT: { geo: [25.28, 54.69], tz: ['Europe/Vilnius'] },
};

const EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

export function guessCountry() {
  try {
    const saved = localStorage.getItem('country');
    if (places[saved]) return saved;
  } catch {}
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hit = Object.entries(places).find(([, p]) => p.tz.includes(tz));
    if (hit) return hit[0];
  } catch {}
  return 'UA';
}

const km = ([lon1, lat1], [lon2, lat2]) => {
  const r = Math.PI / 180, a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};

// A rough guess, not carrier data: same country is quick, inside the EU it grows with
// distance, and a customs border (Ukraine, UK, Switzerland, Norway…) adds the most.
export function estimate(fromCountry, fromGeo, toCountry) {
  const to = places[toCountry];
  if (fromCountry === toCountry) return { days: [1, 3], customs: false };
  if (EU.includes(fromCountry) && EU.includes(toCountry)) {
    const d = km(fromGeo, to.geo);
    return { days: d < 700 ? [2, 4] : d < 1600 ? [3, 5] : [4, 7], customs: false };
  }
  const d = km(fromGeo, to.geo);
  if (fromCountry === 'UA' || toCountry === 'UA') return { days: d < 1000 ? [5, 9] : d < 2000 ? [7, 12] : [9, 14], customs: true };
  return { days: d < 1200 ? [4, 8] : [5, 10], customs: true };
}
