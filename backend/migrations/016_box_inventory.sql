-- Migration 016 · Box Inventory
-- Sprint A · Coach Foundation
-- 2026-05-27
--
-- Cierra el bug crítico: el inventario del box estaba 100% en frontend useState ·
-- moría al refresh · el macrocycle engine ignoraba equipamiento al sugerir.
--
-- Modelo: cada coach (= owner del box) tiene UN inventario · ítems con count/total.
-- Categorías: barbells, plates, kettlebells, ropes, plyo, dumbbells, machines, misc.

CREATE TABLE IF NOT EXISTS box_inventory (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_key      VARCHAR(64) NOT NULL,          -- 'barbell_olympic_20kg', 'kettlebell_24kg', 'plate_45lb'
    name          VARCHAR(120) NOT NULL,         -- "Barra olímpica 20kg"
    category      VARCHAR(32) NOT NULL CHECK (category IN (
                    'barbells', 'plates', 'kettlebells', 'dumbbells',
                    'ropes', 'plyo', 'machines', 'rowers',
                    'bikes', 'rigs', 'medicine_balls', 'misc'
                  )),
    count         INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    total         INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
    unit          VARCHAR(16),                    -- 'unidades', 'kg', 'cm'
    icon          VARCHAR(16),                    -- emoji o lucide name
    notes         TEXT,
    sort_order    INTEGER DEFAULT 100,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (coach_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_box_inventory_coach ON box_inventory(coach_id);
CREATE INDEX IF NOT EXISTS idx_box_inventory_category ON box_inventory(coach_id, category);

COMMENT ON TABLE box_inventory IS 'Inventario de equipamiento por coach (box owner) · usado por macrocycle engine para validar viabilidad de programas asignados.';
COMMENT ON COLUMN box_inventory.count IS 'Cantidad disponible para uso (count <= total).';
COMMENT ON COLUMN box_inventory.total IS 'Cantidad total que el box posee (incluye rotos o en mantenimiento).';


-- Catálogo de tags de equipamiento que requiere cada movimiento.
-- Usado para que el macrocycle engine valide si un programa es ejecutable.

CREATE TABLE IF NOT EXISTS movement_equipment_tags (
    movement_key  VARCHAR(64) PRIMARY KEY,        -- 'wall_ball', 'snatch_squat', 'kb_swing'
    name          VARCHAR(120) NOT NULL,
    required_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
                                                    -- ej: ["wall_ball_9kg", "wall_height"]
    optional_tags JSONB DEFAULT '[]'::jsonb,
    minimum_count INTEGER DEFAULT 1                -- min unidades para una clase típica de 8 atletas
);

COMMENT ON TABLE movement_equipment_tags IS 'Catálogo · qué equipamiento requiere cada movimiento. Macrocycle engine consulta esto + box_inventory para validar.';


-- Seed inicial · ítems estándar de un box CrossFit típico.
-- Cada coach que se cree va a tener estos por defecto si los quiere.
-- (NO se auto-insertan · solo está acá como referencia para el seed.)

-- Ejemplo de uso desde el seed:
--   INSERT INTO box_inventory (coach_id, item_key, name, category, count, total, icon, sort_order)
--   VALUES
--     ($coach_id, 'barbell_olympic_20kg',  'Barras olímpicas 20kg',  'barbells',    12, 12, '🏋️', 10),
--     ($coach_id, 'plate_bumper_kg',       'Bumpers (kg total)',     'plates',     480, 600, '⚪', 20),
--     ($coach_id, 'kettlebell_set',        'Kettlebells',            'kettlebells', 18,  20, '🥊', 30),
--     ($coach_id, 'rope_jump',             'Cuerdas',                'ropes',        4,   4, '🪢', 40),
--     ($coach_id, 'plyo_box',              'Cajones plyo',           'plyo',         8,   8, '📦', 50);
