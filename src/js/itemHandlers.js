// itemHandlers.js
// Manejadores para las acciones de los ítems

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar manejador del botón de guardar ítem
    initSaveItemHandler();
});

/**
 * Inicializa el manejador del botón de guardar ítem
 */
function initSaveItemHandler() {
    const saveButton = document.getElementById('btn-guardar-item');
    if (!saveButton) return;
    
    // Mostrar/ocultar según autenticación
    const user = window.Auth && window.Auth.currentUser;
    if (!user) {
        saveButton.style.display = 'none';
        return;
    }
    
    // Agregar manejador de clic
    saveButton.addEventListener('click', handleSaveItem);
}

/**
 * Maneja el guardado de un ítem
 */
async function handleSaveItem() {
    // Obtener datos del ítem actual
    const itemId = new URLSearchParams(window.location.search).get('id');
    const itemName = document.querySelector('.item-name')?.textContent || 'Ítem sin nombre';
    
    if (!itemId) {
        window.StorageUtils?.showToast('No se pudo obtener el ítem actual', 'error');
        return;
    }
    
    // Guardar el ítem
    const item = { id: parseInt(itemId, 10), nombre: itemName };
    if (window.StorageUtils && window.StorageUtils.saveFavorito) {
        await window.StorageUtils.saveFavorito(item);
    }
    
    // Mostrar notificación
    window.StorageUtils?.showToast('Ítem guardado en favoritos');
}

// Inicialización automática si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initSaveItemHandler, 1);
}
