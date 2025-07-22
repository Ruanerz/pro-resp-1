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
