-- ============================================================
-- CONSTRUCTORIA — SCHEMA COMPLETO PARA POSTGRESQL
-- Ejecutar: psql -d constructor_ia -f constructor_ia_schema_postgres.sql
-- ============================================================

-- ============================================================
-- TABLAS BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias_materiales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  unidad_medida VARCHAR(20),
  activa BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  url VARCHAR(500),
  provincia VARCHAR(100),
  region VARCHAR(100),
  zona_uocra VARCHAR(20),
  telefono VARCHAR(50),
  email VARCHAR(150),
  tipo_fuente VARCHAR(50) DEFAULT 'scraping_html',
  activo BOOLEAN DEFAULT TRUE,
  ultima_actualizacion TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materiales_precios (
  id SERIAL PRIMARY KEY,
  proveedor VARCHAR(200) NOT NULL,
  provincia VARCHAR(100),
  region VARCHAR(100),
  zona_uocra VARCHAR(10),
  producto VARCHAR(255) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  unidad VARCHAR(50) DEFAULT 'unidad',
  url_fuente VARCHAR(500),
  fecha_scraping TIMESTAMP DEFAULT NOW(),
  es_valido BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS mano_obra_escalas (
  id SERIAL PRIMARY KEY,
  zona VARCHAR(20) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  jornal_diario DECIMAL(10,2),
  hora_extra DECIMAL(10,2),
  vigente_desde DATE,
  vigente_hasta DATE,
  fuente VARCHAR(200) DEFAULT 'UOCRA',
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alquiler_maquinaria (
  id SERIAL PRIMARY KEY,
  tipo_maquina VARCHAR(200) NOT NULL,
  proveedor VARCHAR(200),
  provincia VARCHAR(100),
  precio_hora DECIMAL(10,2),
  precio_dia DECIMAL(10,2),
  precio_semana DECIMAL(10,2),
  incluye_operario BOOLEAN DEFAULT FALSE,
  contacto VARCHAR(500),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas_precios (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(100),
  provincia VARCHAR(100),
  severidad VARCHAR(20),
  mensaje TEXT,
  valor_actual DECIMAL(12,2),
  valor_anterior DECIMAL(12,2),
  variacion_porcentual DECIMAL(6,2),
  resuelta BOOLEAN DEFAULT FALSE,
  fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria_scraping (
  id SERIAL PRIMARY KEY,
  proveedor VARCHAR(200),
  provincia VARCHAR(100),
  estado VARCHAR(50),
  mensaje TEXT,
  registros_capturados INT DEFAULT 0,
  fecha TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLAS NACIONALES (PROMEDIOS)
-- ============================================================

CREATE TABLE IF NOT EXISTS regiones_argentina (
  id SERIAL PRIMARY KEY,
  nombre_region VARCHAR(100) NOT NULL UNIQUE,
  zona_uocra VARCHAR(20),
  factor_precio DECIMAL(4,3) DEFAULT 1.000
);

CREATE TABLE IF NOT EXISTS provincias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  abreviatura VARCHAR(5),
  region_id INT REFERENCES regiones_argentina(id),
  zona_geografica VARCHAR(20),
  capital VARCHAR(100),
  activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS promedios_nacionales_diarios (
  id SERIAL PRIMARY KEY,
  fecha_calculo DATE NOT NULL UNIQUE,
  promedio_cemento DECIMAL(10,2),
  promedio_ladrillo DECIMAL(10,2),
  promedio_hierro DECIMAL(10,2),
  promedio_arena DECIMAL(10,2),
  promedio_cal DECIMAL(10,2),
  cantidad_proveedores_activos INT DEFAULT 0,
  cantidad_productos_capturados INT DEFAULT 0,
  variacion_vs_dia_anterior DECIMAL(5,2),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promedios_provinciales_diarios (
  id SERIAL PRIMARY KEY,
  fecha_calculo DATE NOT NULL,
  provincia_id INT REFERENCES provincias(id),
  provincia VARCHAR(100),
  precio_promedio_cemento DECIMAL(10,2),
  precio_promedio_ladrillo DECIMAL(10,2),
  precio_promedio_hierro DECIMAL(10,2),
  precio_promedio_arena DECIMAL(10,2),
  precio_promedio_cal DECIMAL(10,2),
  precio_minimo_provincia DECIMAL(10,2),
  precio_maximo_provincia DECIMAL(10,2),
  rango_variacion DECIMAL(10,2),
  diferencia_vs_promedio_nacional DECIMAL(10,2),
  porcentaje_vs_nacional DECIMAL(5,2),
  cantidad_proveedores_provincia INT DEFAULT 0,
  cantidad_registros INT DEFAULT 0,
  CONSTRAINT uq_prov_fecha UNIQUE (provincia_id, fecha_calculo)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_mp_provincia ON materiales_precios(provincia);
CREATE INDEX IF NOT EXISTS idx_mp_fecha ON materiales_precios(fecha_scraping);
CREATE INDEX IF NOT EXISTS idx_mp_producto ON materiales_precios(producto);
CREATE INDEX IF NOT EXISTS idx_mp_fecha_provincia ON materiales_precios(fecha_scraping, provincia);
CREATE INDEX IF NOT EXISTS idx_pnd_fecha ON promedios_nacionales_diarios(fecha_calculo);
CREATE INDEX IF NOT EXISTS idx_ppd_fecha ON promedios_provinciales_diarios(fecha_calculo);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas_precios(fecha);

-- ============================================================
-- FUNCIÓN: CALCULAR PROMEDIO NACIONAL DEL DÍA
-- Se llama desde el workflow n8n: CALL actualizar_promedios_nacionales()
-- ============================================================

CREATE OR REPLACE PROCEDURE actualizar_promedios_nacionales()
LANGUAGE plpgsql AS $$
DECLARE
  v_fecha DATE := CURRENT_DATE;
  v_cemento DECIMAL(10,2);
  v_ladrillo DECIMAL(10,2);
  v_hierro DECIMAL(10,2);
  v_arena DECIMAL(10,2);
  v_cal DECIMAL(10,2);
  v_proveedores INT;
  v_productos INT;
BEGIN
  SELECT
    ROUND(AVG(CASE WHEN producto ILIKE '%cemento%' THEN precio END)::numeric, 2),
    ROUND(AVG(CASE WHEN producto ILIKE '%ladrillo%' THEN precio END)::numeric, 2),
    ROUND(AVG(CASE WHEN producto ILIKE '%hierro%' OR producto ILIKE '%varilla%' THEN precio END)::numeric, 2),
    ROUND(AVG(CASE WHEN producto ILIKE '%arena%' THEN precio END)::numeric, 2),
    ROUND(AVG(CASE WHEN producto ILIKE '%cal %' OR producto ILIKE '% cal' THEN precio END)::numeric, 2),
    COUNT(DISTINCT proveedor),
    COUNT(*)
  INTO v_cemento, v_ladrillo, v_hierro, v_arena, v_cal, v_proveedores, v_productos
  FROM materiales_precios
  WHERE fecha_scraping::date = v_fecha;

  INSERT INTO promedios_nacionales_diarios
    (fecha_calculo, promedio_cemento, promedio_ladrillo, promedio_hierro,
     promedio_arena, promedio_cal, cantidad_proveedores_activos, cantidad_productos_capturados)
  VALUES
    (v_fecha, v_cemento, v_ladrillo, v_hierro, v_arena, v_cal, v_proveedores, v_productos)
  ON CONFLICT (fecha_calculo) DO UPDATE SET
    promedio_cemento              = EXCLUDED.promedio_cemento,
    promedio_ladrillo             = EXCLUDED.promedio_ladrillo,
    promedio_hierro               = EXCLUDED.promedio_hierro,
    promedio_arena                = EXCLUDED.promedio_arena,
    promedio_cal                  = EXCLUDED.promedio_cal,
    cantidad_proveedores_activos  = EXCLUDED.cantidad_proveedores_activos,
    cantidad_productos_capturados = EXCLUDED.cantidad_productos_capturados;
END;
$$;

-- ============================================================
-- DATOS INICIALES: REGIONES Y PROVINCIAS
-- ============================================================

INSERT INTO regiones_argentina (nombre_region, zona_uocra, factor_precio) VALUES
  ('Metropolitana', 'A', 1.000),
  ('Centro', 'A', 0.980),
  ('NEA', 'A', 0.950),
  ('NOA', 'A', 0.920),
  ('Cuyo', 'A', 0.960),
  ('Patagonia Norte', 'B', 1.150),
  ('Patagonia Austral', 'C', 1.350),
  ('Tierra del Fuego', 'C-Austral', 1.500)
ON CONFLICT (nombre_region) DO NOTHING;

INSERT INTO provincias (nombre, abreviatura, zona_geografica, capital) VALUES
  ('Buenos Aires', 'BA', 'A', 'La Plata'),
  ('CABA', 'CABA', 'A', 'Buenos Aires'),
  ('Santa Fe', 'SF', 'A', 'Santa Fe'),
  ('Cordoba', 'CB', 'A', 'Cordoba'),
  ('Entre Rios', 'ER', 'A', 'Parana'),
  ('Corrientes', 'CR', 'A', 'Corrientes'),
  ('Misiones', 'MI', 'A', 'Posadas'),
  ('Chaco', 'CH', 'A', 'Resistencia'),
  ('Formosa', 'FO', 'A', 'Formosa'),
  ('Salta', 'SA', 'A', 'Salta'),
  ('Jujuy', 'JU', 'A', 'San Salvador de Jujuy'),
  ('Catamarca', 'CA', 'A', 'San Fernando del Valle de Catamarca'),
  ('Tucuman', 'TM', 'A', 'San Miguel de Tucuman'),
  ('La Rioja', 'LR', 'A', 'La Rioja'),
  ('Santiago del Estero', 'SE', 'A', 'Santiago del Estero'),
  ('Mendoza', 'MD', 'A', 'Mendoza'),
  ('San Juan', 'SJ', 'A', 'San Juan'),
  ('San Luis', 'SL', 'A', 'San Luis'),
  ('Neuquen', 'NQ', 'B', 'Neuquen'),
  ('Rio Negro', 'RN', 'B', 'Viedma'),
  ('Chubut', 'CU', 'B', 'Rawson'),
  ('Santa Cruz', 'SC', 'C', 'Rio Gallegos'),
  ('Tierra del Fuego', 'TF', 'C-Austral', 'Ushuaia'),
  ('La Pampa', 'LP', 'A', 'Santa Rosa')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- FIN
-- Para ejecutar: psql -U postgres -d constructor_ia -f constructor_ia_schema_postgres.sql
-- Para crear la base si no existe: createdb -U postgres constructor_ia
-- ============================================================
