-- ============================================================
-- Phase 3a — Stop ingestion: allow stops without coordinates yet
-- ============================================================
-- Motivation:
--   In Phase 3a the driver enters a stop's address manually.
--   Geocoding (address -> lat/lng) is deferred to Phase 3b when
--   we wire a provider (Mapbox / Nominatim). Until then, a stop
--   may exist with `address` set but `location` unknown.
--
--   We relax the NOT NULL constraint on `stops.location` so the
--   row can be inserted now and back-filled later. Stops with
--   NULL location are simply excluded from geospatial queries
--   and from the smart-plan solver (Phase 3c).
-- ============================================================

alter table stops
  alter column location drop not null;

-- The existing GIST index on `stops.location` already skips NULL
-- entries, so no index change is required. Documented here so
-- future readers don't wonder why we did not touch it.