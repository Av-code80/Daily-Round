-- ============================================================
-- Extend door_codes with structured address + driver-useful hints
-- ============================================================
-- Motivation:
--   The initial schema stored the whole address in a single `address`
--   column and used free-text `instructions`. To enable filtering by
--   city/arrondissement and to capture the two distinct hints drivers
--   care about (how to get in, where to park), we add structured
--   columns. Existing rows keep working — all new columns are nullable.
-- ============================================================

alter table door_codes
  add column postal_code    text,
  add column city           text,
  add column arrondissement smallint,
  add column parking_hint   text;

-- Index for "find codes in this postal code" lookups (most common query).
create index door_codes_postal_code_idx on door_codes(postal_code);

-- Guard against nonsense arrondissement values (Paris 1-20, Lyon 1-9, Marseille 1-16).
alter table door_codes
  add constraint door_codes_arrondissement_range
  check (arrondissement is null or (arrondissement between 1 and 20));
