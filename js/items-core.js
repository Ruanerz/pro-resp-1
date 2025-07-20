// Common item functions used across item and compare views
// Copied from original item.js for reuse

export function setIngredientObjs(val) {
  window.ingredientObjs = val;
}

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
  ingredientObjs.forEach((ing, idx) => {
    if (idx === 0) {
      ing.recalc(globalQty, null, null, true);
    } else {
      ing.recalc(globalQty);
    }
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
    const uid = pathArr[i];
    ing = (current || []).find(n => String(n._uid) === String(uid));
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

