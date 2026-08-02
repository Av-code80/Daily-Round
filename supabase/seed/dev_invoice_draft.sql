-- ============================================================
-- DEV SEED — one client + one draft invoice with two lines
-- ============================================================
-- NOT a migration: this file lives outside supabase/migrations/ on
-- purpose, so it never runs against production. Paste it into the
-- Supabase Studio SQL editor to get testable data.
--
-- It attaches the data to the FIRST profile in the table. If you have
-- several accounts, replace the sub-select with your own user id.
-- ============================================================

do $$
declare
  v_user_id    uuid;
  v_client_id  uuid;
  v_invoice_id uuid;
begin
  select id into v_user_id from profiles order by created_at limit 1;

  if v_user_id is null then
    raise exception 'No profile found — sign in to the app once first.';
  end if;

  -- ----------------------------------------------------------
  -- Client
  -- ----------------------------------------------------------
  insert into invoice_clients (
    user_id, name, siret, address_line, postal_code, city,
    email, payment_terms_days
  )
  values (
    v_user_id, 'Cave Duval', '51288700400023', '18 rue de l''Ourcq',
    '75019', 'Paris', 'contact@caveduval.test', 30
  )
  on conflict (user_id, siret) do update set name = excluded.name
  returning id into v_client_id;

  -- ----------------------------------------------------------
  -- Draft invoice
  -- ----------------------------------------------------------
  -- Draft rules enforced by the schema: no number, no finalised_at,
  -- payment_status must stay 'unpaid', and franchise regime means
  -- vat_amount = 0.
  insert into invoices (
    user_id, client_id, kind, status, payment_status,
    vat_regime, billing_unit,
    total_excl_vat, vat_amount, total_incl_vat, notes
  )
  values (
    v_user_id, v_client_id, 'invoice', 'draft', 'unpaid',
    'franchise', 'tournee',
    320.00, 0, 320.00, 'Semaine 30 — livraisons quotidiennes'
  )
  returning id into v_invoice_id;

  -- ----------------------------------------------------------
  -- Lines
  -- ----------------------------------------------------------
  -- line_total is stored, not computed on read: a finalised invoice
  -- must keep the amount that was actually issued.
  insert into invoice_lines (
    invoice_id, order_index, description, quantity, unit_price, line_total
  )
  values
    (v_invoice_id, 1, 'Tournée camionnette — semaine 30', 4, 65.00, 260.00),
    (v_invoice_id, 2, 'Supplément attente > 30 min',      2, 30.00,  60.00);

  raise notice '--------------------------------------------';
  raise notice 'user_id    : %', v_user_id;
  raise notice 'client_id  : %', v_client_id;
  raise notice 'INVOICE_ID : %', v_invoice_id;
  raise notice '--------------------------------------------';
end $$;

-- Read back what was created, with the two-axis status and the
-- derived "overdue" flag computed the same way the UI does it.
select
  i.id,
  i.status,
  i.payment_status,
  i.number,
  i.total_incl_vat,
  c.name as client,
  count(l.id) as line_count
from invoices i
join invoice_clients c on c.id = i.client_id
left join invoice_lines l on l.invoice_id = i.id
where i.status = 'draft'
group by i.id, c.name
order by i.created_at desc;
