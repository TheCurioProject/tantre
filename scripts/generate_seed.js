/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const categories = [
  { id: '11111111-1111-1111-1111-111111111111', type: 'cafe', slug: 'caliente', title: 'Caliente', sort_order: 10, published: true },
  { id: '22222222-2222-2222-2222-222222222222', type: 'cafe', slug: 'frio', title: 'Frío', sort_order: 20, published: true },
  { id: '33333333-3333-3333-3333-333333333333', type: 'cafe', slug: 'extras', title: 'Extras', sort_order: 30, published: true },
  { id: '44444444-4444-4444-4444-444444444444', type: 'cafe', slug: 'snacks', title: 'Snacks', sort_order: 40, published: true },
  { id: '55555555-5555-5555-5555-555555555555', type: 'cafe', slug: 'especiales', title: 'Bebidas especiales', sort_order: 50, published: true },
  { id: '66666666-6666-6666-6666-666666666666', type: 'cafe', slug: 'drinks', title: '¿Unos drinks?', sort_order: 60, published: true },
];

const items = [
  // Caliente
  { cat: 'caliente', name: 'Espresso', slug: 'espresso', price: 2500, asset: 'menu-hot-espresso' },
  { cat: 'caliente', name: 'Cappuccino', slug: 'cappuccino', price: 6500, asset: 'menu-hot-cappuccino' },
  { cat: 'caliente', name: 'Latte', slug: 'latte', price: 6500, asset: 'menu-hot-latte' },
  { cat: 'caliente', name: 'Americano', slug: 'americano', price: 4500, asset: 'menu-hot-americano' },
  { cat: 'caliente', name: 'De Olla', slug: 'de-olla', price: 5500, asset: 'menu-hot-de-olla' },
  { cat: 'caliente', name: 'Moka', slug: 'moka', price: 6800, asset: 'menu-hot-moka' },
  { cat: 'caliente', name: 'Chocolate', slug: 'chocolate', price: 5000, asset: 'menu-hot-chocolate' },
  { cat: 'caliente', name: 'Matcha', slug: 'matcha', price: 7000, asset: 'menu-hot-matcha' },
  { cat: 'caliente', name: 'Taro', slug: 'taro', price: 6500, asset: 'menu-hot-taro' },
  { cat: 'caliente', name: 'Chai Vainilla', slug: 'chai-vainilla', price: 6500, asset: 'menu-hot-chai-vainilla' },
  { cat: 'caliente', name: 'Tisana', slug: 'tisana', price: 6000, asset: 'menu-hot-tisana' },
  { cat: 'caliente', name: 'Té', slug: 'te', price: 5000, asset: 'menu-hot-te' },

  // Frío
  { cat: 'frio', name: 'Soda italiana', slug: 'soda-italiana', price: 5800, asset: 'menu-cold-soda-italiana' },
  { cat: 'frio', name: 'Moka', slug: 'moka-frio', price: 7000, asset: 'menu-cold-moka' },
  { cat: 'frio', name: 'Latte Frio', slug: 'latte-frio', price: 7000, asset: 'menu-cold-latte' },
  { cat: 'frio', name: 'Americano', slug: 'americano-frio', price: 5000, asset: 'menu-cold-americano' },
  { cat: 'frio', name: 'Taro', slug: 'taro-frio', price: 6800, asset: 'menu-cold-taro' },
  { cat: 'frio', name: 'Matcha cerem', slug: 'matcha-cerem', price: 7300, asset: 'menu-cold-matcha-cerem' },
  { cat: 'frio', name: 'Chai vainilla', slug: 'chai-vainilla-frio', price: 6800, asset: 'menu-cold-chai-vainilla' },
  { cat: 'frio', name: 'Tisana', slug: 'tisana-frio', price: 6000, asset: 'menu-cold-tisana' },
  { cat: 'frio', name: 'Té', slug: 'te-frio', price: 5500, asset: 'menu-cold-te' },
  { cat: 'frio', name: 'Frappes', slug: 'frappes', price: 7000, asset: 'menu-cold-frappe' },
  { cat: 'frio', name: 'Cold Brew', slug: 'cold-brew', price: 6000, asset: 'menu-cold-cold-brew' },
  { cat: 'frio', name: 'Agua Mineral', slug: 'agua-mineral', price: 1800, asset: 'menu-cold-agua-mineral' },

  // Extras
  { cat: 'extras', name: 'Shot de sabor', slug: 'shot-sabor', price: 1200, asset: 'menu-extra-shot' },
  { cat: 'extras', name: 'Shot de café', slug: 'shot-cafe', price: 1800, asset: 'menu-extra-shot-cafe' },
  { cat: 'extras', name: 'Leche de avena', slug: 'leche-avena', price: 1200, asset: 'menu-extra-leche-avena' },
  { cat: 'extras', name: 'Cold foam', slug: 'cold-foam', price: 1000, asset: 'menu-extra-cold-foam' },

  // Snacks
  { cat: 'snacks', name: 'Panini salado', slug: 'panini-salado', price: 9500, asset: 'menu-snack-panini-salado' },
  { cat: 'snacks', name: 'Pan dulce relleno', slug: 'pan-dulce-relleno', price: 4000, asset: 'menu-snack-pan-dulce-relleno' },
  { cat: 'snacks', name: 'Pan dulce sencillo', slug: 'pan-dulce-sencillo', price: 3000, asset: 'menu-snack-pan-dulce-sencillo' },
  { cat: 'snacks', name: 'Crepa dulce', slug: 'crepa-dulce', price: 8000, asset: 'menu-snack-crepa-dulce' },
  { cat: 'snacks', name: 'Crepa salada', slug: 'crepa-salada', price: 8000, asset: 'menu-snack-crepa-salada' },

  // Especiales
  { cat: 'especiales', name: "Tantre ta'fresado", slug: 'tantre-tafresado', price: 7000, asset: 'menu-esp-tantresado' },
  { cat: 'especiales', name: 'Denis Red Fruit', slug: 'denis-red-fruit', price: 5500, asset: 'menu-esp-denis-red-fruit' },
  { cat: 'especiales', name: 'Caramel "Manchado"', slug: 'caramel-manchado', price: 6000, asset: 'menu-esp-caramel-manchado' },
  { cat: 'especiales', name: 'Affogato vainilla', slug: 'affogato-vainilla', price: 5800, asset: 'menu-esp-affogato' },
  { cat: 'especiales', name: 'Tisana "Strudel"', slug: 'tisana-strudel', price: 6300, asset: 'menu-esp-tisana-strudel' },
  { cat: 'especiales', name: 'Bebida de temporada', slug: 'bebida-temporada', price: 6800, asset: 'menu-esp-temporada' },

  // Drinks
  { cat: 'drinks', name: 'Expresso Martini', slug: 'expresso-martini', price: 7000, asset: 'menu-drink-espresso-martini' },
  { cat: 'drinks', name: 'Copa de vino tinto', slug: 'copa-vino-tinto', price: 5000, asset: 'menu-drink-vino-tinto' },
  { cat: 'drinks', name: 'Margarita N°20', slug: 'margarita-20', price: 6500, asset: 'menu-drink-margarita' },
];

let sql = `-- Seed file for Cafe Menu items based on new assets\n\n`;

for (const c of categories) {
  sql += `INSERT INTO public.catalog_categories (id, type, slug, title, sort_order, published)
VALUES ('${c.id}', '${c.type}', '${c.slug}', '${c.title}', ${c.sort_order}, ${c.published})
ON CONFLICT (type, slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, published = EXCLUDED.published;\n`;
}

sql += `\n`;

items.forEach((item, i) => {
  const cat = categories.find(c => c.slug === item.cat);
  sql += `
WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = '${cat.slug}'), '${item.slug}', '${item.name.replace(/'/g, "''")}', ${item.price}, 'available', true, ${(i + 1) * 10}, '${item.asset}')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;
`;
});

fs.writeFileSync(path.join(__dirname, '../supabase/migrations/202610050006_menu_seed.sql'), sql);
console.log('Generated migration file successfully.');
