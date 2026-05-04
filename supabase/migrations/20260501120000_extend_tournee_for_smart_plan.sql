-- ============================================================
-- Extend tournees + stops for the smart plan + multi-vehicle UX
-- ============================================================
-- Motivation:
--   Tournées need to know the driver's vehicle (constrains the
--   smart-plan solver). Stops need time windows, priority and a
--   point_score so the planner can sequence + load the camion
--   optimally. An optional door_code FK lets a stop reuse the
--   community door-code data we already store.
-- ============================================================

-- 1. tournees: vehicle, parcel scale, notes
alter table tournees
  add column vehicle_type  text not null default 'van'
    check (vehicle_type in ('bike','scooter','car','van','truck')),
  add column parcel_count  int default 0 check (parcel_count >= 0),
  add column notes         text;

-- 2. stops: planning fields the smart solver consumes
alter table stops
  add column time_window_start time,
  add column time_window_end   time,
  add column priority          smallint default 2
    check (priority between 1 and 3),
  add column weight_kg         numeric(6,2)
    check (weight_kg is null or weight_kg >= 0),
  add column point_score       numeric(8,2)
    check (point_score is null or point_score >= 0),
  add column door_code_id      uuid
    references door_codes(id) on delete set null;

-- 3. Helpful indexes
create index stops_door_code_id_idx          on stops(door_code_id);
create index stops_tournee_time_window_idx   on stops(tournee_id, time_window_end);
