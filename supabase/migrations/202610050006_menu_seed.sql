-- Seed file for Cafe Menu items based on new assets

INSERT INTO public.catalog_categories (id, type, slug, title, sort_order, published)
VALUES ('11111111-1111-1111-1111-111111111111', 'cafe', 'caliente', 'Caliente', 10, true)
ON CONFLICT (type, slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, published = EXCLUDED.published;
INSERT INTO public.catalog_categories (id, type, slug, title, sort_order, published)
VALUES ('22222222-2222-2222-2222-222222222222', 'cafe', 'frio', 'Frío', 20, true)
ON CONFLICT (type, slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, published = EXCLUDED.published;
INSERT INTO public.catalog_categories (id, type, slug, title, sort_order, published)
VALUES ('33333333-3333-3333-3333-333333333333', 'cafe', 'extras', 'Extras', 30, true)
ON CONFLICT (type, slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, published = EXCLUDED.published;
INSERT INTO public.catalog_categories (id, type, slug, title, sort_order, published)
VALUES ('44444444-4444-4444-4444-444444444444', 'cafe', 'snacks', 'Snacks', 40, true)
ON CONFLICT (type, slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, published = EXCLUDED.published;
INSERT INTO public.catalog_categories (id, type, slug, title, sort_order, published)
VALUES ('55555555-5555-5555-5555-555555555555', 'cafe', 'especiales', 'Bebidas especiales', 50, true)
ON CONFLICT (type, slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, published = EXCLUDED.published;
INSERT INTO public.catalog_categories (id, type, slug, title, sort_order, published)
VALUES ('66666666-6666-6666-6666-666666666666', 'cafe', 'drinks', '¿Unos drinks?', 60, true)
ON CONFLICT (type, slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, published = EXCLUDED.published;


WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'espresso', 'Espresso', 2500, 'available', true, 10, 'menu-hot-espresso')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'cappuccino', 'Cappuccino', 6500, 'available', true, 20, 'menu-hot-cappuccino')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'latte', 'Latte', 6500, 'available', true, 30, 'menu-hot-latte')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'americano', 'Americano', 4500, 'available', true, 40, 'menu-hot-americano')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'de-olla', 'De Olla', 5500, 'available', true, 50, 'menu-hot-de-olla')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'moka', 'Moka', 6800, 'available', true, 60, 'menu-hot-moka')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'chocolate', 'Chocolate', 5000, 'available', true, 70, 'menu-hot-chocolate')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'matcha', 'Matcha', 7000, 'available', true, 80, 'menu-hot-matcha')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'taro', 'Taro', 6500, 'available', true, 90, 'menu-hot-taro')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'chai-vainilla', 'Chai Vainilla', 6500, 'available', true, 100, 'menu-hot-chai-vainilla')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'tisana', 'Tisana', 6000, 'available', true, 110, 'menu-hot-tisana')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'caliente'), 'te', 'Té', 5000, 'available', true, 120, 'menu-hot-te')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'soda-italiana', 'Soda italiana', 5800, 'available', true, 130, 'menu-cold-soda-italiana')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'moka-frio', 'Moka', 7000, 'available', true, 140, 'menu-cold-moka')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'latte-frio', 'Latte Frio', 7000, 'available', true, 150, 'menu-cold-latte')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'americano-frio', 'Americano', 5000, 'available', true, 160, 'menu-cold-americano')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'taro-frio', 'Taro', 6800, 'available', true, 170, 'menu-cold-taro')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'matcha-cerem', 'Matcha cerem', 7300, 'available', true, 180, 'menu-cold-matcha-cerem')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'chai-vainilla-frio', 'Chai vainilla', 6800, 'available', true, 190, 'menu-cold-chai-vainilla')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'tisana-frio', 'Tisana', 6000, 'available', true, 200, 'menu-cold-tisana')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'te-frio', 'Té', 5500, 'available', true, 210, 'menu-cold-te')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'frappes', 'Frappes', 7000, 'available', true, 220, 'menu-cold-frappe')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'cold-brew', 'Cold Brew', 6000, 'available', true, 230, 'menu-cold-cold-brew')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'frio'), 'agua-mineral', 'Agua Mineral', 1800, 'available', true, 240, 'menu-cold-agua-mineral')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'extras'), 'shot-sabor', 'Shot de sabor', 1200, 'available', true, 250, 'menu-extra-shot')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'extras'), 'shot-cafe', 'Shot de café', 1800, 'available', true, 260, 'menu-extra-shot-cafe')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'extras'), 'leche-avena', 'Leche de avena', 1200, 'available', true, 270, 'menu-extra-leche-avena')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'extras'), 'cold-foam', 'Cold foam', 1000, 'available', true, 280, 'menu-extra-cold-foam')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'snacks'), 'panini-salado', 'Panini salado', 9500, 'available', true, 290, 'menu-snack-panini-salado')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'snacks'), 'pan-dulce-relleno', 'Pan dulce relleno', 4000, 'available', true, 300, 'menu-snack-pan-dulce-relleno')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'snacks'), 'pan-dulce-sencillo', 'Pan dulce sencillo', 3000, 'available', true, 310, 'menu-snack-pan-dulce-sencillo')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'snacks'), 'crepa-dulce', 'Crepa dulce', 8000, 'available', true, 320, 'menu-snack-crepa-dulce')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'snacks'), 'crepa-salada', 'Crepa salada', 8000, 'available', true, 330, 'menu-snack-crepa-salada')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'especiales'), 'tantre-tafresado', 'Tantre ta''fresado', 7000, 'available', true, 340, 'menu-esp-tantresado')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'especiales'), 'denis-red-fruit', 'Denis Red Fruit', 5500, 'available', true, 350, 'menu-esp-denis-red-fruit')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'especiales'), 'caramel-manchado', 'Caramel "Manchado"', 6000, 'available', true, 360, 'menu-esp-caramel-manchado')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'especiales'), 'affogato-vainilla', 'Affogato vainilla', 5800, 'available', true, 370, 'menu-esp-affogato')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'especiales'), 'tisana-strudel', 'Tisana "Strudel"', 6300, 'available', true, 380, 'menu-esp-tisana-strudel')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'especiales'), 'bebida-temporada', 'Bebida de temporada', 6800, 'available', true, 390, 'menu-esp-temporada')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'drinks'), 'expresso-martini', 'Expresso Martini', 7000, 'available', true, 400, 'menu-drink-espresso-martini')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'drinks'), 'copa-vino-tinto', 'Copa de vino tinto', 5000, 'available', true, 410, 'menu-drink-vino-tinto')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;

WITH new_item AS (
  INSERT INTO public.catalog_items (type, category_id, slug, name, price_cents, status, published, sort_order, asset)
  VALUES ('cafe', (SELECT id FROM public.catalog_categories WHERE type = 'cafe' AND slug = 'drinks'), 'margarita-20', 'Margarita N°20', 6500, 'available', true, 420, 'menu-drink-margarita')
  ON CONFLICT (type, slug) DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, asset = EXCLUDED.asset, published = true, category_id = EXCLUDED.category_id
  RETURNING id
)
INSERT INTO public.cafe_meta (item_id, temperature, caffeine, dietary_tags, allergens, alcohol_note)
SELECT id, '', false, '{}', '{}', '' FROM new_item
ON CONFLICT (item_id) DO NOTHING;
