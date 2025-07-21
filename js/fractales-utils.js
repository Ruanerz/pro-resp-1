// Utilidades compartidas para fractales y forja mística
export const iconCache = {};
export const rarityCache = {};

export async function fetchIconsFor(ids = []) {
  if (!ids.length) return;
  try {
    const res = await fetch(`https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=es`);
    const data = await res.json();
    data.forEach(item => {
      if (item && item.id) {
        iconCache[item.id] = item.icon;
        rarityCache[item.id] = item.rarity;
      }
    });
  } catch {}
}

export async function fetchItemPrices(ids = []) {
  if (!ids || ids.length === 0) return {};
  const url = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${ids.join(',')}`;
  try {
    const csv = await fetch(url).then(r => r.text());
    const [header, ...rows] = csv.trim().split('\n');
    const headers = header.split(',');
    const idIdx = headers.indexOf('id');
    const buyIdx = headers.indexOf('buy_price');
    const sellIdx = headers.indexOf('sell_price');
    const result = {};
    rows.forEach(row => {
      const cols = row.split(',');
      const id = parseInt(cols[idIdx], 10);
      if (!isNaN(id)) {
        result[id] = {
          buy_price: parseInt(cols[buyIdx], 10) || 0,
          sell_price: parseInt(cols[sellIdx], 10) || 0
        };
      }
    });
    return result;
  } catch (e) {
    return {};
  }
}

if (typeof window !== 'undefined') {
  window.FractalesUtils = { fetchIconsFor, fetchItemPrices, iconCache, rarityCache };
}
