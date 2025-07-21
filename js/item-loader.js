import {
  fetchItemData,
  fetchRecipeData,
  fetchMarketDataForItem,
  prepareIngredientTreeData,
  CraftIngredient,
  setIngredientObjs
} from './items-core.js';

// Cargar datos y preparar la UI al iniciar la página
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const itemId = parseInt(params.get('id'), 10);

  if (!itemId) {
    window.showError?.('ID de ítem no válido');
    return;
  }

  try {
    window.showLoader?.(true);

    const itemData = await fetchItemData(itemId);
    const recipeData = await fetchRecipeData(itemId);
    const marketData = await fetchMarketDataForItem(itemId);

    let rootIngredient;

    if (recipeData) {
      let children = await prepareIngredientTreeData(itemId, recipeData);
      if (!Array.isArray(children)) children = [];
      rootIngredient = new CraftIngredient({
        id: itemData.id,
        name: itemData.name,
        icon: itemData.icon,
        rarity: itemData.rarity,
        count: 1,
        buy_price: marketData.buy_price,
        sell_price: marketData.sell_price,
        is_craftable: true,
        recipe: recipeData,
        children
      });
      rootIngredient.recalc(window.globalQty || 1, null);
    } else {
      rootIngredient = new CraftIngredient({
        id: itemData.id,
        name: itemData.name,
        icon: itemData.icon,
        rarity: itemData.rarity,
        count: 1,
        buy_price: marketData.buy_price,
        sell_price: marketData.sell_price,
        is_craftable: false,
        recipe: null,
        children: []
      });
    }

    setIngredientObjs([rootIngredient]);
    await window.renderItemUI?.(itemData, marketData);
  } catch (err) {
    console.error('Error cargando ítem', err);
    window.showError?.('Error al cargar los datos del ítem');
  } finally {
    window.showLoader?.(false);
  }
});
