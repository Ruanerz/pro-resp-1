# Legendary Crafting Data

This repository contains the scripts used by the site. Source files are kept in `src/js` and the distributable, minified versions live in `dist/`.

Run `npm run build` to regenerate the bundles. The command uses Rollup to transform each file under `src/js` into `dist/<name>.min.js`.

Include the bundles from `dist/` in your HTML pages:

```html
<script src="dist/bundle-legendary.min.js"></script>
```

After loading `dist/bundle-legendary.min.js` a global object `window.LegendaryData` becomes available with the following properties:

- `LEGENDARY_ITEMS` – mapping of first generation legendary items.
- `LEGENDARY_ITEMS_3GEN` – mapping of third generation legendary weapons.
- `BASIC_MATERIALS` – shared basic material definitions for Gen 1 items.
- `BASIC_MATERIALS_3GEN` – basic material definitions for Gen 3 items.

Example usage:

```html
<script src="dist/bundle-legendary.min.js"></script>
<script>
  const { LEGENDARY_ITEMS } = window.LegendaryData;
  console.log(Object.keys(LEGENDARY_ITEMS));
</script>
```

Modules such as `dones.js` rely on this object to fetch legendary item information. Future scripts should also consume data from `window.LegendaryData` to ensure consistency across the project.

## Notas de refactorización

- Todas las páginas HTML ahora cargan scripts desde `dist/` en lugar de `js/`.
- Los archivos fuente originales se movieron a `src/js`.
- Varias funciones de `items-core.js` se exponen en `window` para seguir siendo accesibles sin módulos.

## Configuración del backend

El proyecto incluye un pequeño backend en PHP ubicado en `backend/` que se encarga de guardar favoritos, comparaciones y la información de la sesión.

### Crear la base de datos

1. Crea una base de datos en tu servidor MySQL (por defecto se usa `gw2db`).
2. Ejecuta el script `setup.sql` para crear las tablas necesarias:

   ```bash
   mysql -u <usuario> -p <nombre_db> < backend/setup.sql
   ```

### Configurar credenciales

`backend/config.php` lee las credenciales de conexión mediante las variables de entorno `DB_HOST`, `DB_NAME`, `DB_USER` y `DB_PASS`. Si no existen, se emplean los valores predeterminados definidos en el archivo. Puedes exportar dichas variables en tu terminal o modificar los valores por defecto según tu entorno.

### Endpoints disponibles

Dentro de `backend/api/` existen tres endpoints principales que el frontend consume mediante `fetch`:

- **`user.php`** – Devuelve la información del usuario autenticado.
- **`favorites.php`** – Permite listar, añadir o eliminar IDs de ítems favoritos usando los métodos `GET`, `POST` y `DELETE` respectivamente.
- **`comparisons.php`** – Gestiona las comparativas guardadas con la misma convención de métodos HTTP.

Todos ellos requieren que el navegador envíe la cookie `session_id` generada al autenticarse con `auth.php` y `oauth_callback.php`. Los módulos de `src/js/storageUtils.js` y `src/js/cuenta.js` muestran ejemplos de cómo se consumen desde el frontend.
