import { parseQuery } from '../src/search.js';
const qs = ['худи до 3000 грн с доставкой в Киев','ukrainian tee under €60 with returns','куртка от 5000 до 12000','карго 2-4к грн','кепка Palace','штаны до 100 евро доставка в Польшу','свитер со скидкой','hoodie 100-200 eur ship to EU', 'кросовки до 4 тыс'];
for (const q of qs) console.log(q.padEnd(45), JSON.stringify(parseQuery(q)));
