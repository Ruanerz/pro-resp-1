// storageUtils.js - async helpers using backend API

/** Obtiene los favoritos del usuario desde el backend */
async function getFavoritos() {
    try {
        const r = await fetch('backend/api/favorites.php');
        if (!r.ok) return [];
        const data = await r.json();
        return Array.isArray(data) ? data.map(id => ({ id: parseInt(id, 10) })) : [];
    } catch (e) {
        console.error('Error obteniendo favoritos', e);
        return [];
    }
}

/** Guarda un ítem como favorito en el backend */
async function saveFavorito(item) {
    if (!item || !item.id) return [];
    try {
        await fetch('backend/api/favorites.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: item.id })
        });
    } catch (e) {
        console.error('Error guardando favorito', e);
    }
    return getFavoritos();
}

/** Elimina un favorito en el backend */
async function removeFavorito(itemId) {
    try {
        await fetch(`backend/api/favorites.php?item_id=${itemId}`, { method: 'DELETE' });
    } catch (e) {
        console.error('Error eliminando favorito', e);
    }
    return getFavoritos();
}

/** Obtiene las comparativas guardadas desde el backend */
async function getComparativas() {
    try {
        const r = await fetch('backend/api/comparisons.php');
        if (!r.ok) return [];
        const data = await r.json();
        return Array.isArray(data)
            ? data.map(c => ({ id: c.id, ids: [Number(c.item_left), Number(c.item_right)] }))
            : [];
    } catch (e) {
        console.error('Error obteniendo comparativas', e);
        return [];
    }
}

/** Guarda una comparativa (usa los dos primeros IDs) */
async function saveComparativa(comparativa) {
    if (!comparativa || !Array.isArray(comparativa.ids) || comparativa.ids.length < 2) return [];
    try {
        await fetch('backend/api/comparisons.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_left: comparativa.ids[0], item_right: comparativa.ids[1] })
        });
    } catch (e) {
        console.error('Error guardando comparativa', e);
    }
    return getComparativas();
}

/** Elimina una comparativa por id */
async function removeComparativa(id) {
    try {
        await fetch(`backend/api/comparisons.php?id=${id}`, { method: 'DELETE' });
    } catch (e) {
        console.error('Error eliminando comparativa', e);
    }
    return getComparativas();
}

/** Muestra un toast sencillo */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.opacity = '0';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) container.remove();
        }, 300);
    }, 3000);
}

window.StorageUtils = {
    saveFavorito,
    getFavoritos,
    removeFavorito,
    saveComparativa,
    getComparativas,
    removeComparativa,
    showToast
};
