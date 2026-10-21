create table if not exists profiles (
  user_id text primary key,
  role text not null,
  full_name text not null,
  phone text not null,
  cedula text not null,
  status text not null default 'pending',
  elite boolean not null default false,
  cedula_photo text,
  selfie text,
  plate text,
  model text,
  bank_phone text,
  reject_note text,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  user_id text primary key,
  device_id text not null,
  updated_at timestamptz not null default now()
);

create table if not exists positions (
  user_id text primary key,
  lat double precision not null,
  lng double precision not null,
  online boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists trips (
  id text primary key,
  passenger_id text not null,
  driver_id text,
  preferred_driver_id text,
  status text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  pickup_ref text not null,
  dest_lat double precision not null,
  dest_lng double precision not null,
  dest_ref text,
  fare_usd double precision not null,
  distance_m integer not null,
  pay_method text not null,
  pay_ref text,
  pay_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_status_idx on trips (status);
create index if not exists profiles_status_idx on profiles (status);
