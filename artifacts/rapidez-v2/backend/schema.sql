-- Rapidez Carora — esquema Supabase (PostgreSQL + PostGIS)
-- Seguro de volver a ejecutar: no borra datos.
-- Pégalo completo en Supabase → SQL Editor → Run.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM (
    'REQUESTED',
    'ACCEPTED',
    'DRIVER_ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CASH_USD', 'CASH_VES', 'PAGO_MOVIL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFYING', 'PAID', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  national_id VARCHAR(20) UNIQUE NOT NULL,
  vehicle_plate VARCHAR(10) NOT NULL,
  vehicle_model VARCHAR(50) DEFAULT 'Bera X1000',
  is_active BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT false,
  current_location GEOMETRY(Point, 4326),
  pago_movil_bank_code VARCHAR(10),
  pago_movil_phone VARCHAR(20),
  fcm_token TEXT,
  rating NUMERIC(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES passengers(id),
  driver_id UUID REFERENCES drivers(id),
  status trip_status DEFAULT 'REQUESTED',
  origin_location GEOMETRY(Point, 4326) NOT NULL,
  origin_address TEXT NOT NULL,
  origin_reference TEXT NOT NULL,
  destination_location GEOMETRY(Point, 4326) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_reference TEXT,
  fare_usd NUMERIC(10,2) NOT NULL,
  exchange_rate_ves NUMERIC(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'PENDING',
  payment_reference_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Columnas que el API necesita y el PDF original no traía.
ALTER TABLE passengers ADD COLUMN IF NOT EXISTS access_token_hash TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS access_token_hash TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pago_movil_holder_id VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_note TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_passengers_token
  ON passengers (access_token_hash) WHERE access_token_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_token
  ON drivers (access_token_hash) WHERE access_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_location
  ON drivers USING GIST (current_location);
CREATE INDEX IF NOT EXISTS idx_trips_origin
  ON trips USING GIST (origin_location);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);
CREATE INDEX IF NOT EXISTS idx_drivers_available
  ON drivers (is_active, is_available);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (key, value) VALUES
  ('exchange_rate_ves', '50'),
  ('base_fare_usd', '1'),
  ('per_km_usd', '0.40'),
  ('min_fare_usd', '1'),
  ('search_radius_m', '3500')
ON CONFLICT (key) DO NOTHING;

-- Activar un motorizado a mano (después de revisar fotos por WhatsApp):
-- UPDATE drivers
-- SET is_active = true
-- WHERE phone_number = '04141234567';
