-- Enable PostGIS
create extension if not exists postgis;

-- ============================================================
-- UTILITY: updated_at trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: public read"
  on profiles for select using (true);

create policy "profiles: owner update"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- EMPLOYERS
-- ============================================================
create table employers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  siret       text unique,
  city        text,
  created_at  timestamptz not null default now()
);

alter table employers enable row level security;

create policy "employers: public read"
  on employers for select using (true);

create policy "employers: authenticated insert"
  on employers for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- EMPLOYER REVIEWS
-- ============================================================
create table employer_reviews (
  id           uuid primary key default gen_random_uuid(),
  employer_id  uuid not null references employers(id) on delete cascade,
  user_id      uuid references profiles(id) on delete set null,
  rating       smallint not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

alter table employer_reviews enable row level security;

create policy "employer_reviews: public read"
  on employer_reviews for select using (true);

create policy "employer_reviews: authenticated insert"
  on employer_reviews for insert with check (auth.uid() = user_id);

create policy "employer_reviews: owner delete"
  on employer_reviews for delete using (auth.uid() = user_id);

-- ============================================================
-- TOURNEES
-- ============================================================
create type tournee_status as enum ('pending', 'in_progress', 'completed');

create table tournees (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  employer_id  uuid references employers(id) on delete set null,
  name         text not null,
  date         date not null,
  status       tournee_status not null default 'pending',
  created_at   timestamptz not null default now()
);

create index tournees_user_id_idx on tournees(user_id);
create index tournees_date_idx on tournees(date);

alter table tournees enable row level security;

create policy "tournees: owner read"
  on tournees for select using (auth.uid() = user_id);

create policy "tournees: owner insert"
  on tournees for insert with check (auth.uid() = user_id);

create policy "tournees: owner update"
  on tournees for update using (auth.uid() = user_id);

create policy "tournees: owner delete"
  on tournees for delete using (auth.uid() = user_id);

-- ============================================================
-- STOPS
-- ============================================================
create type stop_status as enum ('pending', 'completed', 'failed');

create table stops (
  id              uuid primary key default gen_random_uuid(),
  tournee_id      uuid not null references tournees(id) on delete cascade,
  address         text not null,
  location        geography(point, 4326) not null,
  order_index     smallint not null,
  status          stop_status not null default 'pending',
  recipient_name  text,
  notes           text,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index stops_tournee_id_idx on stops(tournee_id);
create index stops_location_idx on stops using gist(location);

alter table stops enable row level security;

-- Stops inherit access from their parent tournee (owner only)
create policy "stops: owner read"
  on stops for select using (
    exists (select 1 from tournees where tournees.id = stops.tournee_id and tournees.user_id = auth.uid())
  );

create policy "stops: owner insert"
  on stops for insert with check (
    exists (select 1 from tournees where tournees.id = stops.tournee_id and tournees.user_id = auth.uid())
  );

create policy "stops: owner update"
  on stops for update using (
    exists (select 1 from tournees where tournees.id = stops.tournee_id and tournees.user_id = auth.uid())
  );

create policy "stops: owner delete"
  on stops for delete using (
    exists (select 1 from tournees where tournees.id = stops.tournee_id and tournees.user_id = auth.uid())
  );

-- ============================================================
-- DOOR CODES (community terrain data)
-- ============================================================
create table door_codes (
  id              uuid primary key default gen_random_uuid(),
  address         text not null,
  location        geography(point, 4326) not null,
  code            text not null,
  floor           text,
  instructions    text,
  contributed_by  uuid references profiles(id) on delete set null,
  upvote_count    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index door_codes_location_idx on door_codes using gist(location);

alter table door_codes enable row level security;

create trigger door_codes_updated_at
  before update on door_codes
  for each row execute function set_updated_at();

create policy "door_codes: public read"
  on door_codes for select using (true);

create policy "door_codes: authenticated insert"
  on door_codes for insert with check (auth.uid() = contributed_by);

create policy "door_codes: contributor update"
  on door_codes for update using (auth.uid() = contributed_by);

create policy "door_codes: contributor delete"
  on door_codes for delete using (auth.uid() = contributed_by);

-- ============================================================
-- INCIDENTS (IncidentFlash)
-- ============================================================
create type incident_type as enum (
  'road_blocked',
  'parking_issue',
  'dog',
  'access_problem',
  'other'
);

create table incidents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete set null,
  location    geography(point, 4326) not null,
  type        incident_type not null,
  description text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '2 hours')
);

create index incidents_location_idx on incidents using gist(location);
create index incidents_expires_at_idx on incidents(expires_at);

alter table incidents enable row level security;

-- Only show non-expired incidents
create policy "incidents: public read active"
  on incidents for select using (expires_at > now());

create policy "incidents: authenticated insert"
  on incidents for insert with check (auth.uid() = user_id);

create policy "incidents: owner delete"
  on incidents for delete using (auth.uid() = user_id);
