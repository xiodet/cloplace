// One Mercator projection for the Map page. The dot map (scripts/generate-dot-map.mjs)
// and the city pins both use it, so a pin always sits exactly on the dots of its city.
export const MAP = { w: 960, h: 791, lon: [-11, 45], lat: [34.6, 63.6] };

const rad = Math.PI / 180;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2));
const top = merc(MAP.lat[1]);
const k = MAP.w / ((MAP.lon[1] - MAP.lon[0]) * rad); // map units per radian

export const project = ([lon, lat]) => [(lon - MAP.lon[0]) * rad * k, (top - merc(lat)) * k];
export const unproject = ([x, y]) => [x / k / rad + MAP.lon[0], (2 * Math.atan(Math.exp(top - y / k)) - Math.PI / 2) / rad];

// Great-circle distance in kilometres between two [lon, lat] points (haversine).
export const km = ([lon1, lat1], [lon2, lat2]) => {
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};
