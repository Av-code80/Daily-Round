-- ============================================================
-- DEV SEED — a realistic client book to exercise the combobox
-- ============================================================
-- NOT a migration: lives outside supabase/migrations/ so it never
-- reaches production. Paste into the Supabase Studio SQL editor.
--
-- Twelve clients on purpose: enough that the 5 "recent" entries no
-- longer cover the book, so the search path and the "see all clients"
-- escape hatch both get exercised. Several names share a prefix
-- ("Pharmacie", "Boulangerie") to test that trigram search actually
-- narrows instead of dumping everything.
-- ============================================================

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from profiles order by created_at limit 1;

  if v_user_id is null then
    raise exception 'No profile found — sign in to the app once first.';
  end if;

  insert into invoice_clients (
    user_id, name, siret, address_line, postal_code, city, email, payment_terms_days
  )
  values
    (v_user_id, 'Cave Duval',              '51288700400023', '18 rue de l''Ourcq',      '75019', 'Paris',        'contact@caveduval.test',     30),
    (v_user_id, 'Pharmacie Lemire',        '80422190700011', '4 avenue Jean Jaurès',    '75019', 'Paris',        'contact@lemire.test',        30),
    (v_user_id, 'Pharmacie du Marché',     '44219087600034', '9 place du Marché',       '93500', 'Pantin',       'contact@pharmarche.test',    45),
    (v_user_id, 'Boulangerie Petit',       '39887411200018', '22 rue de Belleville',    '75020', 'Paris',        'petit@boulangerie.test',     30),
    (v_user_id, 'Boulangerie Saint-Jean',  '61200945300027', '3 rue Saint-Jean',        '93100', 'Montreuil',    'sj@boulangerie.test',        15),
    (v_user_id, 'Restaurant Ourcq',        '77451220800045', '55 quai de l''Oise',      '75019', 'Paris',        'resa@ourcq.test',            30),
    (v_user_id, 'Fleuriste Belleville',    '52098334100012', '7 rue Rébeval',           '75019', 'Paris',        null,                         30),
    (v_user_id, 'Épicerie Nour',           '83366120900056', '12 rue Petit',            '75019', 'Paris',        'nour@epicerie.test',         30),
    (v_user_id, 'Librairie du Canal',      '49877003200021', '31 quai de la Loire',     '75019', 'Paris',        'contact@librairiecanal.test', 60),
    (v_user_id, 'Traiteur Aubervilliers',  '58120944700039', '88 avenue Victor Hugo',   '93300', 'Aubervilliers','commande@traiteur93.test',   45),
    (v_user_id, 'Primeur Bio Pantin',      '66033891400014', '5 rue Hoche',             '93500', 'Pantin',       null,                         30),
    (v_user_id, 'Cave Saint-Martin',       '71455620300048', '140 quai de Jemmapes',    '75010', 'Paris',        'cave@saintmartin.test',      30)
  on conflict (user_id, siret) do update
    set name = excluded.name,
        city = excluded.city,
        payment_terms_days = excluded.payment_terms_days;

  raise notice 'Clients seeded for user %', v_user_id;
end $$;

-- What the combobox will see, in the same order as `listRecentClients`
select name, siret, city, payment_terms_days, updated_at
from invoice_clients
order by updated_at desc;

-- ============================================================
-- Contractual floors on two clients, so the UI behaviour is testable
-- ============================================================
-- Cave Duval bills a 40-parcel floor; Traiteur Aubervilliers a 25-parcel
-- floor. Every other client has NULL, i.e. no floor — the form must
-- behave correctly in both cases.
update invoice_clients set min_billable_quantity = 40 where name = 'Cave Duval';
update invoice_clients set min_billable_quantity = 25 where name = 'Traiteur Aubervilliers';

select name, min_billable_quantity, payment_terms_days
from invoice_clients
order by min_billable_quantity nulls last, name;
