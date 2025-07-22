// Bundled dones core and tabs
const API_ITEM = 'https://api.guildwars2.com/v2/items/';
const API_PRICES = 'https://api.guildwars2.com/v2/commerce/prices/';
const itemCache = new Map();
const priceCache = new Map();

const FIXED_PRICE_ITEMS = { 19676: 10000 };

const EXCLUDED_ITEM_IDS = [
  19675, 19925, 20796, 19665, 19674, 19626, 19672, 19673,
  19645, 19650, 19655, 19639, 19635, 19621
];

function isGiftName(name){
  if(!name) return false;
  const lower = name.toLowerCase();
  return lower.startsWith('don de ') || lower.startsWith('don del ') || lower.startsWith('don de la ');
}

function shouldSkipMarketCheck(id){
  return EXCLUDED_ITEM_IDS.includes(id);
}

async function fetchItemData(id) {
  if (itemCache.has(id)) return itemCache.get(id);
  const stored = sessionStorage.getItem('item:' + id);
  if (stored) {
    const data = JSON.parse(stored);
    itemCache.set(id, data);
    return data;
  }
  const res = await fetch(API_ITEM + id);
  if (!res.ok) throw new Error('No se pudo obtener info de item ' + id);
  const json = await res.json();
  itemCache.set(id, json);
  try { sessionStorage.setItem('item:' + id, JSON.stringify(json)); } catch(e) {}
  return json;
}

async function fetchPriceData(id) {
  if (FIXED_PRICE_ITEMS[id] !== undefined) {
    const value = FIXED_PRICE_ITEMS[id];
    return {buys:{unit_price:value}, sells:{unit_price:value}};
  }
  if(shouldSkipMarketCheck(id)) return null;
  if (priceCache.has(id)) return priceCache.get(id);
  const stored = sessionStorage.getItem('price:' + id);
  if (stored) {
    const data = JSON.parse(stored);
    priceCache.set(id, data);
    return data;
  }
  const res = await fetch(API_PRICES + id);
  if (!res.ok) return null;
  const json = await res.json();
  priceCache.set(id, json);
  try { sessionStorage.setItem('price:' + id, JSON.stringify(json)); } catch(e){}
  return json;
}

if (typeof window !== 'undefined') {
  window.DonesCore = { fetchItemData, fetchPriceData, isGiftName, shouldSkipMarketCheck };
}
// Manejo de pestañas en dones.html
document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.item-tab-btn');
  const loaded = {};

  async function switchTab(tabId) {
    document.querySelectorAll('.container-don, .container-tributo').forEach(tab => {
      tab.style.display = 'none';
    });
    
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.style.display = 'block';
    }
    
    const activeButton = document.querySelector(`.item-tab-btn[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    localStorage.setItem('activeDonTab', tabId);

    if (!loaded[tabId] && window.DonesPages) {
      loaded[tabId] = true;
      if (tabId === 'tab-don-suerte') window.DonesPages.loadSpecialDons();
      else if (tabId === 'tab-tributo-mistico') window.DonesPages.loadTributo();
      else if (tabId === 'tab-tributo-draconico') window.DonesPages.loadDraconicTribute();
      else if (tabId === 'dones-1ra-gen') window.DonesPages.loadDones1Gen();
    }
  }
  
  // Manejar clics en los botones de pestaña
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Cargar la pestaña guardada o mostrar la primera por defecto
  const savedTab = localStorage.getItem('activeDonTab');
  if (savedTab && document.getElementById(savedTab)) {
    switchTab(savedTab);
  } else if (tabButtons.length > 0) {
    const defaultTab = tabButtons[0].getAttribute('data-tab');
    switchTab(defaultTab);
  }
});
