alter table profiles add column if not exists saldo_usd double precision not null default 3;
alter table profiles add column if not exists rating_sum double precision not null default 5;
alter table profiles add column if not exists rating_count integer not null default 1;

alter table trips add column if not exists offer_driver_id text;
alter table trips add column if not exists offer_until_ms double precision;
alter table trips add column if not exists offer_skip text not null default '';
alter table trips add column if not exists share_token text;
alter table trips add column if not exists commission_usd double precision not null default 0;
alter table trips add column if not exists panic_at timestamptz;

create table if not exists ratings (
  trip_id text not null,
  from_user text not null,
  to_user text not null,
  stars integer not null,
  primary key (trip_id, from_user)
);
