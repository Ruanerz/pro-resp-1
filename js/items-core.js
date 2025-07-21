// Common item functions used across item and compare views
// Copied from original item.js for reuse

if (typeof window !== 'undefined') {
  window.ingredientObjs = window.ingredientObjs || [];
  window.globalQty = window.globalQty || 1;
  window._mainBuyPrice = window._mainBuyPrice || 0;
  window._mainSellPrice = window._mainSellPrice || 0;
  window._mainRecipeOutputCount = window._mainRecipeOutputCount || 1;
}

export function setIngredientObjs(val) {
  window.ingredientObjs = val;
}

// -------------------------
// Core data structures
// -------------------------

export class CraftIngredient {
  constructor({id, name, icon, rarity, count, parentMultiplier = 1, buy_price, sell_price, is_craftable, recipe, children = [], _parentId = null}) {
    this._uid = CraftIngredient.nextUid++;
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.rarity = rarity;
    this.count = count;
    this.parentMultiplier = parentMultiplier || 1;
    this.buy_price = buy_price;
    this.sell_price = sell_price;
    this.is_craftable = is_craftable;
    this.recipe = recipe || null;
    this.children = children;
    this.mode = 'buy';
    this.modeForParentCrafted = 'buy';
    this.expanded = false;
    this._parentId = _parentId;
    this._parent = null;
    this.countTotal = 0;
    this.crafted_price = null;
    this.total_buy = 0;
    this.total_sell = 0;
    this.total_crafted = 0;
  }

  findRoot() {
    let current = this;
    while (current._parent) current = current._parent;
    return current;
  }

  setMode(newMode) {
    if (['buy', 'sell', 'crafted'].includes(newMode)) {
      this.modeForParentCrafted = newMode;
      const root = this.findRoot();
      root.recalc(window.globalQty || 1, null);
      if (typeof window.safeRenderTable === 'function') window.safeRenderTable();
    }
  }

  recalc(globalQty = 1, parent = null) {
    const isRoot = parent == null;
    if (isRoot) {
      this.countTotal = this.count * globalQty;
    } else {
      this.countTotal = parent.countTotal * this.count;
    }

    if (this.children && this.children.length > 0) {
      this.children.forEach(child => child.recalc(globalQty, this));
    }

    if (isRoot) {
      this.total_buy = this.children.reduce((s, c) => s + (c.total_buy || 0), 0);
      this.total_sell = this.children.reduce((s, c) => s + (c.total_sell || 0), 0);
    } else {
      this.total_buy = (this.buy_price || 0) * this.countTotal;
      this.total_sell = (this.sell_price || 0) * this.countTotal;
    }

    if (this.is_craftable && this.children.length > 0) {
      this.total_crafted = this.children.reduce((sum, ing) => {
        switch (ing.modeForParentCrafted) {
          case 'buy': return sum + (ing.total_buy || 0);
          case 'sell': return sum + (ing.total_sell || 0);
          case 'crafted': return sum + (ing.total_crafted || 0);
          default: return sum + (ing.total_buy || 0);
        }
      }, 0);
      this.crafted_price = this.total_crafted / (this.recipe?.output_item_count || 1);

      if (!isRoot && (!this.buy_price && !this.sell_price)) {
        this.total_buy = this.children.reduce((s, c) => s + (c.total_buy || 0), 0);
        this.total_sell = this.children.reduce((s, c) => s + (c.total_sell || 0), 0);
      }
    } else {
      this.total_crafted = null;
      this.crafted_price = null;
    }
  }

  getBestPrice() {
    if (typeof this.buy_price === 'number' && this.buy_price > 0) return this.buy_price;
    if (typeof this.crafted_price === 'number' && this.crafted_price > 0) return this.crafted_price;
    return 0;
  }
}

CraftIngredient.nextUid = 0;

export function setGlobalQty(val) {
  window.globalQty = val;
}

export function snapshotExpandState(ings) {
  if (!ings) return [];
  return ings.map(ing => ({
    id: ing.id,
    expanded: ing.expanded,
    children: snapshotExpandState(ing.children || [])
  }));
}

export function restoreExpandState(ings, snapshot) {
  if (!ings || !snapshot) return;
  for (let i = 0; i < ings.length; i++) {
    if (snapshot[i]) {
      ings[i].expanded = snapshot[i].expanded;
      restoreExpandState(ings[i].children, snapshot[i].children);
    }
  }
}

export function recalcAll(ingredientObjs, globalQty) {
  if (!ingredientObjs) return;
  ingredientObjs.forEach((ing) => {
    ing.recalc(globalQty, null);
  });
}

export function getTotals(ingredientObjs) {
  let totalBuy = 0, totalSell = 0, totalCrafted = 0;
  for (const ing of ingredientObjs) {
    totalBuy += ing.total_buy || 0;
    totalSell += ing.total_sell || 0;
    const craftedVal =
      (ing.total_crafted !== undefined && ing.total_crafted !== null)
        ? ing.total_crafted
        : ing.total_buy || 0;
    totalCrafted += craftedVal;
  }
  return { totalBuy, totalSell, totalCrafted };
}

export function findIngredientByIdAndParent(ings, id, parentId) {
  for (const ing of ings) {
    if (String(ing.id) === String(id) && String(ing._parentId) === String(parentId)) {
      return ing;
    }
    if (Array.isArray(ing.children) && ing.children.length) {
      const found = findIngredientByIdAndParent(ing.children, id, parentId);
      if (found) return found;
    }
  }
  return null;
}

export function findIngredientByPath(ings, pathArr) {
  let current = ings;
  let ing = null;
  for (let i = 0; i < pathArr.length; i++) {
    const val = pathArr[i];
    ing = (current || []).find(n => String(n._uid) === String(val) || String(n.id) === String(val));
    if (!ing) return null;
    current = ing.children;
  }
  return ing;
}

export function findIngredientByUid(ings, uid) {
  for (const ing of ings) {
    if (String(ing._uid) === String(uid)) return ing;
    if (ing.children && ing.children.length) {
      const found = findIngredientByUid(ing.children, uid);
      if (found) return found;
    }
  }
  return null;
}

export function findIngredientById(ings, id) {
  for (const ing of ings) {
    if (String(ing.id) === String(id)) return ing;
    if (ing.children && ing.children.length) {
      const found = findIngredientById(ing.children, id);
      if (found) return found;
    }
  }
  return null;
}

// -------------------------
// API helpers
// -------------------------

export async function fetchItemData(id) {
  const r = await fetch(`https://api.guildwars2.com/v2/items/${id}?lang=es`);
  if (!r.ok) throw new Error(`Error ${r.status} obteniendo datos del ítem ${id}`);
  return r.json();
}

export async function fetchRecipeData(outputItemId) {
  const recipeSearch = await fetch(`https://api.guildwars2.com/v2/recipes/search?output=${outputItemId}`);
  if (!recipeSearch.ok) return null;
  const ids = await recipeSearch.json();
  if (!ids || ids.length === 0) return null;
  const recipeId = ids[0];
  const recipeRes = await fetch(`https://api.guildwars2.com/v2/recipes/${recipeId}?lang=es`);
  if (!recipeRes.ok) throw new Error(`Error ${recipeRes.status} obteniendo datos de la receta ${recipeId}`);
  return recipeRes.json();
}

export async function fetchMarketDataForItem(id) {
  const fields = [
    'id','buy_price','sell_price','buy_quantity','sell_quantity',
    'last_updated','1d_buy_sold','1d_sell_sold','2d_buy_sold','2d_sell_sold',
    '7d_buy_sold','7d_sell_sold','1m_buy_sold','1m_sell_sold'
  ].join(',');
  const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=${fields}&ids=${id}`;
  const csvText = await fetch(csvUrl).then(r => { if(!r.ok) throw new Error(`Error ${r.status} obteniendo datos de mercado para el ítem ${id}`); return r.text(); });
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return {};
  const headers = lines[0].split(',');
  const values = lines[1].split(',');
  const result = {};
  headers.forEach((h,i) => { result[h] = values[i] !== undefined ? (isNaN(values[i]) ? values[i] : Number(values[i])) : null; });
  return result;
}

export async function prepareIngredientTreeData(mainItemId, mainRecipeData) {
  if (!mainRecipeData || !mainRecipeData.ingredients || mainRecipeData.ingredients.length === 0) {
    window.ingredientObjs = [];
    window._mainRecipeOutputCount = mainRecipeData ? (mainRecipeData.output_item_count || 1) : 1;
    return [];
  }

  window._mainRecipeOutputCount = mainRecipeData.output_item_count || 1;

  const allItemIdsInTree = new Set();
  async function collectAllNestedItemIds(recipeIngredients, currentSet) {
    if (!recipeIngredients || recipeIngredients.length === 0) return;
    const ids = recipeIngredients.map(ing => ing.item_id);
    const items = ids.length > 0 ? await fetch(`https://api.guildwars2.com/v2/items?ids=${ids.join(',')}&lang=es`).then(r=>r.json()) : [];
    for (const itemDetail of items) {
      if (currentSet.has(itemDetail.id)) continue;
      currentSet.add(itemDetail.id);
      const subRecipeSearch = await fetch(`https://api.guildwars2.com/v2/recipes/search?output=${itemDetail.id}`).then(r=>r.json());
      if (subRecipeSearch && subRecipeSearch.length > 0) {
        const subId = subRecipeSearch[0];
        const subFull = await fetch(`https://api.guildwars2.com/v2/recipes/${subId}?lang=es`).then(r=>r.json());
        if (subFull && subFull.ingredients) {
          await collectAllNestedItemIds(subFull.ingredients, currentSet);
        }
      }
    }
  }
  await collectAllNestedItemIds(mainRecipeData.ingredients, allItemIdsInTree);
  mainRecipeData.ingredients.forEach(ing => allItemIdsInTree.add(ing.item_id));

  const allItemsDetailsMap = new Map();
  if (allItemIdsInTree.size > 0) {
    const allIdsArray = Array.from(allItemIdsInTree);
    for (let i=0; i<allIdsArray.length; i+=200) {
      const chunk = allIdsArray.slice(i, i+200);
      const itemsChunkData = await fetch(`https://api.guildwars2.com/v2/items?ids=${chunk.join(',')}&lang=es`).then(r=>r.json());
      itemsChunkData.forEach(item => allItemsDetailsMap.set(item.id, item));
    }
  }

  const marketDataMap = new Map();
  if (allItemIdsInTree.size > 0) {
    try {
      const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${Array.from(allItemIdsInTree).join(',')}`;
      const csvText = await fetch(csvUrl).then(r=>r.text());
      const [headers, ...rows] = csvText.trim().split('\n').map(line=>line.split(','));
      if (headers && headers.length > 0 && rows.length > 0 && rows[0].length === headers.length) {
        for (const row of rows) {
          const obj={};
          headers.forEach((h,idx)=>{ const value=row[idx]; if(h==='id') obj[h]=parseInt(value,10); else if(h==='buy_price'||h==='sell_price') obj[h]=value!==''&&value!==undefined?parseInt(value,10):null; else obj[h]=value; });
          if (obj.id) marketDataMap.set(obj.id, obj);
        }
      }
    } catch(e) { console.error('Error fetching or parsing CSV market data:', e); }
  }

  async function buildTreeRecursive(ingredientRecipeInfo, currentParentMultiplier, parentId=null) {
    const itemDetail = allItemsDetailsMap.get(ingredientRecipeInfo.item_id);
    if (!itemDetail) return null;
    const marketInfo = marketDataMap.get(ingredientRecipeInfo.item_id) || {};
    let children = [];
    let subRecipeFullData = null;
    let isCraftable = false;
    const subRecipeSearch = await fetch(`https://api.guildwars2.com/v2/recipes/search?output=${ingredientRecipeInfo.item_id}`).then(r=>r.json());
    if (subRecipeSearch && subRecipeSearch.length > 0) {
      const subRecipeId = subRecipeSearch[0];
      subRecipeFullData = await fetch(`https://api.guildwars2.com/v2/recipes/${subRecipeId}?lang=es`).then(r=>r.json());
      if (subRecipeFullData && subRecipeFullData.ingredients) {
        isCraftable = true;
        children = await Promise.all(subRecipeFullData.ingredients.map(subIng => buildTreeRecursive(subIng, subRecipeFullData.output_item_count || 1, itemDetail.id)));
        children = children.filter(c=>c!==null);
      }
    }
    return new CraftIngredient({
      id: itemDetail.id,
      name: itemDetail.name,
      icon: itemDetail.icon,
      rarity: itemDetail.rarity,
      count: ingredientRecipeInfo.count,
      parentMultiplier: currentParentMultiplier,
      buy_price: marketInfo.buy_price !== undefined ? marketInfo.buy_price : null,
      sell_price: marketInfo.sell_price !== undefined ? marketInfo.sell_price : null,
      crafted_price: null,
      is_craftable: isCraftable,
      recipe: subRecipeFullData,
      children: children,
      _parentId: parentId
    });
  }

  let finalIngredientObjs = [];
  if (mainRecipeData && mainRecipeData.ingredients) {
    finalIngredientObjs = await Promise.all(mainRecipeData.ingredients.map(ing => buildTreeRecursive(ing, window._mainRecipeOutputCount, mainItemId)));
    finalIngredientObjs = finalIngredientObjs.filter(c=>c!==null);
  }

  function linkParents(node, parent) {
    node._parent = parent;
    if (node.children) node.children.forEach(child => linkParents(child, node));
  }
  finalIngredientObjs.forEach(rootNode => { linkParents(rootNode, null); rootNode.recalc(window.globalQty, null); });

  return finalIngredientObjs;
}

export function createCraftIngredientFromRecipe(recipe, parentMultiplier = 1, parentId = null) {
  const ingredient = new CraftIngredient({
    id: recipe.id,
    name: recipe.name,
    icon: recipe.icon,
    rarity: recipe.rarity,
    count: recipe.count || 1,
    recipe: recipe.recipe || null,
    buy_price: recipe.buy_price || 0,
    sell_price: recipe.sell_price || 0,
    is_craftable: recipe.is_craftable || false,
    children: [],
    _parentId: parentId
  });
  if (recipe.children && recipe.children.length > 0) {
    ingredient.children = recipe.children.map(child => createCraftIngredientFromRecipe(structuredClone ? structuredClone(child) : JSON.parse(JSON.stringify(child)), child.count * parentMultiplier, ingredient.id));
  }
  return ingredient;
}

// -------------------------
// Comparativa helpers
// -------------------------

if (typeof window.comparativa === 'undefined') {
  window.comparativa = {};
}

window.comparativa.agregarItemPorId = async function(id) {
  window.ingredientObjs = window.ingredientObjs || [];
  window.globalQty = window.globalQty || 1;
  if (window.ingredientObjs.some(obj => obj.id == id)) return;
  try {
    if (typeof window.showLoader === 'function') window.showLoader(true);
    const itemData = await fetchItemData(id);
    const recipeData = await fetchRecipeData(id);
    let ingredientesArbol;
    if (recipeData) {
      let hijos = await prepareIngredientTreeData(id, recipeData);
      if (!Array.isArray(hijos)) hijos = [];
      const marketData = await fetchMarketDataForItem(id);
      window._mainBuyPrice = marketData.buy_price || 0;
      window._mainSellPrice = marketData.sell_price || 0;
      window._mainRecipeOutputCount = recipeData ? (recipeData.output_item_count || 1) : 1;
      ingredientesArbol = new CraftIngredient({
        id: itemData.id,
        name: itemData.name,
        icon: itemData.icon,
        rarity: itemData.rarity,
        count: 1,
        buy_price: marketData.buy_price,
        sell_price: marketData.sell_price,
        is_craftable: true,
        recipe: recipeData,
        children: hijos,
      });
      ingredientesArbol.recalc(window.globalQty || 1, null);
    } else {
      const marketData = await fetchMarketDataForItem(id);
      window._mainBuyPrice = marketData.buy_price || 0;
      window._mainSellPrice = marketData.sell_price || 0;
      window._mainRecipeOutputCount = 1;
      ingredientesArbol = new CraftIngredient({
        id: itemData.id,
        name: itemData.name,
        icon: itemData.icon,
        rarity: itemData.rarity,
        count: 1,
        buy_price: marketData.buy_price,
        sell_price: marketData.sell_price,
        is_craftable: false,
        recipe: null,
        children: [],
      });
    }
    window.ingredientObjs.push(ingredientesArbol);
    if (typeof window.safeRenderTable === 'function') window.safeRenderTable();
    if (typeof window.showLoader === 'function') window.showLoader(false);
  } catch (e) {
    if (typeof window.showLoader === 'function') window.showLoader(false);
    alert('Error al agregar el ítem: ' + e.message);
  }
};

window.comparativa.handleSaveComparativa = function() {
  if (!window.ingredientObjs || window.ingredientObjs.length === 0) {
    window.StorageUtils?.showToast('Agrega al menos un ítem a la comparativa', 'error');
    return;
  }
  const ids = window.ingredientObjs.map(obj => obj.id);
  const nombres = window.ingredientObjs.map(obj => obj.name);
  const comparativa = { ids, nombres, timestamp: Date.now() };
  if (window.StorageUtils && typeof window.StorageUtils.saveComparativa === 'function') {
    window.StorageUtils.saveComparativa('gw2_comparativas', comparativa);
    window.StorageUtils.showToast('Comparativa guardada');
  } else {
    alert('StorageUtils no está disponible.');
  }
};

window.comparativa.loadComparativaFromURL = function() {
  const params = new URLSearchParams(window.location.search);
  const idsParam = params.get('ids');
  if (!idsParam) return;
  const ids = idsParam.split(',').map(id => parseInt(id,10)).filter(n => !isNaN(n));
  if (ids.length === 0) return;
  window.ingredientObjs = window.ingredientObjs || [];
  window.globalQty = window.globalQty || 1;
  const tryLoad = () => {
    if (window.comparativa && typeof window.comparativa.agregarItemPorId === 'function') {
      (async () => { for (const id of ids) { try { await window.comparativa.agregarItemPorId(id); } catch(e) { console.error('Error cargando ítem de la URL', id, e); } } })();
    } else {
      setTimeout(tryLoad, 50);
    }
  };
  tryLoad();
};

export function calcPercent(sold, available) {
  if (!sold || !available || isNaN(sold) || isNaN(available) || available === 0) return '-';
  return ((sold / available) * 100).toFixed(1) + '%';
}

// Assign to window for non-module scripts
if (typeof window !== 'undefined') {
  window.setIngredientObjs = setIngredientObjs;
  window.setGlobalQty = setGlobalQty;
  window.snapshotExpandState = snapshotExpandState;
  window.restoreExpandState = restoreExpandState;
  window.recalcAll = recalcAll;
  window.getTotals = getTotals;
  window.findIngredientByIdAndParent = findIngredientByIdAndParent;
  window.findIngredientByPath = findIngredientByPath;
  window.findIngredientByUid = findIngredientByUid;
  window.findIngredientById = findIngredientById;
  window.calcPercent = calcPercent;
}

