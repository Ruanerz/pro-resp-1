# Legendary Crafting Data

This repository contains bundled scripts used by the site. The file
`js/bundle-legendary.js` exposes crafting data for all legendary items
through a global object so that any page can use the information without
additional imports.

## Global `LegendaryData`

After loading `js/bundle-legendary.js` a global object `window.LegendaryData`
becomes available with the following properties:

- `LEGENDARY_ITEMS` – mapping of first generation legendary items.
- `LEGENDARY_ITEMS_3GEN` – mapping of third generation legendary weapons.
- `BASIC_MATERIALS` – shared basic material definitions for Gen 1 items.
- `BASIC_MATERIALS_3GEN` – basic material definitions for Gen 3 items.

Example usage:

```html
<script src="js/bundle-legendary.js"></script>
<script>
  const { LEGENDARY_ITEMS } = window.LegendaryData;
  console.log(Object.keys(LEGENDARY_ITEMS));
</script>
```

Modules such as `dones.js` rely on this object to fetch legendary item
information. Future scripts should also consume data from `window.LegendaryData`
to ensure consistency across the project.
