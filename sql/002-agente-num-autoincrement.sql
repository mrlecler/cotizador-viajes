-- ============================================================
-- 002: Auto-asignación atómica de agente_num + código agencia
-- Ejecutar en Supabase SQL Editor (en orden)
-- ============================================================

-- 1. Código único de agencia (3-4 letras, elegido por la agencia)
ALTER TABLE agencias ADD COLUMN IF NOT EXISTS codigo VARCHAR(4) UNIQUE;

-- Asignar códigos provisorios a agencias existentes que no tengan
UPDATE agencias SET codigo = 'PYR' WHERE nombre ILIKE '%pato y ro%' AND codigo IS NULL;
UPDATE agencias SET codigo = 'PRB' WHERE nombre ILIKE '%prueba%' AND codigo IS NULL;
UPDATE agencias SET codigo = 'EMX' WHERE nombre ILIKE '%ermix%' AND codigo IS NULL;
-- Cualquier agencia sin código → primeras 3 letras del nombre (puede requerir ajuste manual)
UPDATE agencias SET codigo = UPPER(LEFT(REGEXP_REPLACE(nombre, '[^a-zA-Z]', '', 'g'), 3))
WHERE codigo IS NULL AND nombre IS NOT NULL;

-- 2. Tabla de secuencia global para agente_num
CREATE TABLE IF NOT EXISTS _sequences (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO _sequences (name, value)
VALUES ('agente_num', COALESCE((SELECT MAX(agente_num) FROM agentes), 0))
ON CONFLICT (name) DO UPDATE SET value = GREATEST(_sequences.value, EXCLUDED.value);

-- 3. RPC atómica: retorna el próximo agente_num
CREATE OR REPLACE FUNCTION next_agente_num()
RETURNS INTEGER AS $$
  UPDATE _sequences SET value = value + 1
  WHERE name = 'agente_num'
  RETURNING value;
$$ LANGUAGE sql;

-- 4. Migrar agentes existentes sin agente_num
DO $$
DECLARE
  r RECORD;
  n INTEGER;
BEGIN
  FOR r IN SELECT id FROM agentes WHERE agente_num IS NULL ORDER BY creado_en, id
  LOOP
    SELECT next_agente_num() INTO n;
    UPDATE agentes SET agente_num = n WHERE id = r.id;
  END LOOP;
END $$;

-- 5. Migrar cotizaciones y clientes del agente de prueba al usuario real
UPDATE cotizaciones
SET agente_id = 'cf563053-3216-44e5-a2f6-945f50bc4f56'
WHERE agente_id = '2579a8b8-b943-4cdb-8e41-45a1bc233938';

UPDATE clientes
SET agente_id = 'cf563053-3216-44e5-a2f6-945f50bc4f56'
WHERE agente_id = '2579a8b8-b943-4cdb-8e41-45a1bc233938';

-- 6. Verificar
SELECT id, nombre, codigo FROM agencias ORDER BY nombre;
SELECT id, nombre, email, rol, agente_num, agencia_id, cotizacion_seq FROM agentes ORDER BY agente_num;
