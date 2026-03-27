-- ============================================================
-- Liberal Nurse - Migration Finale Complète
-- Compatible Supabase Cloud
-- ============================================================

-- ============================================================
-- SECTION 1 : NETTOYAGE
-- ============================================================

drop function if exists public.register_cabinet_and_profile cascade;
drop function if exists public.my_cabinet_id cascade;
drop function if exists public.set_updated_at cascade;

drop table if exists public.plaies_suivi cascade;
drop table if exists public.plaies cascade;
drop table if exists public.notifications cascade;
drop table if exists public.fiches_soins cascade;
drop table if exists public.stock_movements cascade;
drop table if exists public.stock_items cascade;
drop table if exists public.retrocessions cascade;
drop table if exists public.contrats cascade;
drop table if exists public.sms_logs cascade;
drop table if exists public.messages cascade;
drop table if exists public.transmissions cascade;
drop table if exists public.soin_notes cascade;
drop table if exists public.visits cascade;
drop table if exists public.patients cascade;
drop table if exists public.users cascade;
drop table if exists public.cabinets cascade;

-- ============================================================
-- SECTION 2 : EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- ============================================================
-- SECTION 3 : TABLES
-- ============================================================

create table public.cabinets (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  address               text not null,
  phone                 text not null,
  email                 text,
  siret                 text not null unique,
  finess                text,
  stripe_customer_id    text,
  stripe_subscription_id text,
  plan                  text not null default 'trial' check (plan in ('trial','starter','pro','enterprise')),
  plan_expires_at       timestamptz,
  settings              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  cabinet_id  uuid references public.cabinets(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  role        text check (role in ('admin','titulaire','collaboratrice','remplacante','stagiaire','coordinatrice_had','secretaire','medecin_partenaire')),
  rpps        text,
  phone       text,
  avatar_url  text,
  color       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.patients (
  id                      uuid primary key default uuid_generate_v4(),
  cabinet_id              uuid not null references public.cabinets(id) on delete cascade,
  last_name               text not null,
  first_name              text not null,
  birth_date              date,
  gender                  text check (gender in ('M','F','autre')),
  address                 text,
  city                    text,
  postal_code             text,
  lat                     double precision,
  lng                     double precision,
  phone                   text,
  phone_emergency         text,
  emergency_contact_name  text,
  nir                     text,
  mutuelle                text,
  mutuelle_num            text,
  medecin_traitant        text,
  medecin_prescripteur    text,
  pathologies             text[],
  allergies               text[],
  notes                   text,
  photo_url               text,
  active                  boolean not null default true,
  created_by              uuid references public.users(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table public.visits (
  id               uuid primary key default uuid_generate_v4(),
  cabinet_id       uuid not null references public.cabinets(id) on delete cascade,
  patient_id       uuid not null references public.patients(id) on delete cascade,
  nurse_id         uuid not null references public.users(id) on delete cascade,
  date             date not null,
  time_slot        text check (time_slot in ('morning','afternoon','evening','night')),
  start_time       time,
  end_time         time,
  status           text not null default 'planned' check (status in ('planned','done','cancelled','absent')),
  acte_codes       text[],
  acte_labels      text[],
  duration_minutes integer,
  notes            text,
  distance_km      numeric(8,2),
  recurrence       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.soin_notes (
  id         uuid primary key default uuid_generate_v4(),
  visit_id   uuid references public.visits(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  nurse_id   uuid not null references public.users(id) on delete cascade,
  content    text not null,
  constantes jsonb,
  photos     text[],
  signed_at  timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transmissions (
  id         uuid primary key default uuid_generate_v4(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  author_id  uuid not null references public.users(id) on delete cascade,
  content    text not null,
  priority   text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  category   text not null default 'general' check (category in ('general','medical','administrative','urgent')),
  read_by    uuid[] not null default '{}',
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.messages (
  id           uuid primary key default uuid_generate_v4(),
  cabinet_id   uuid not null references public.cabinets(id) on delete cascade,
  sender_id    uuid not null references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete cascade,
  subject      text,
  content      text not null,
  read         boolean not null default false,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create table public.sms_logs (
  id         uuid primary key default uuid_generate_v4(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  sender_id  uuid not null references public.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  phone_to   text not null,
  content    text not null,
  status     text not null default 'pending' check (status in ('pending','sent','failed')),
  twilio_sid text,
  sent_at    timestamptz,
  created_at timestamptz not null default now()
);

create table public.contrats (
  id                   uuid primary key default uuid_generate_v4(),
  cabinet_id           uuid not null references public.cabinets(id) on delete cascade,
  titulaire_id         uuid not null references public.users(id) on delete cascade,
  remplacante_id       uuid references public.users(id) on delete set null,
  remplacante_name     text,
  remplacante_rpps     text,
  date_debut           date not null,
  date_fin             date not null,
  retrocession         numeric(5,2) not null default 0 check (retrocession >= 0 and retrocession <= 100),
  honoraires_prevus    numeric(10,2),
  honoraires_realises  numeric(10,2),
  motif                text,
  statut               text not null default 'draft' check (statut in ('draft','signed','active','terminated')),
  document_url         text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.retrocessions (
  id                 uuid primary key default uuid_generate_v4(),
  cabinet_id         uuid not null references public.cabinets(id) on delete cascade,
  contrat_id         uuid references public.contrats(id) on delete set null,
  remplacante_id     uuid not null references public.users(id) on delete cascade,
  periode_debut      date not null,
  periode_fin        date not null,
  montant_brut       numeric(10,2) not null,
  montant_net        numeric(10,2) not null,
  taux               numeric(5,2) not null,
  statut             text not null default 'pending' check (statut in ('pending','paid','cancelled')),
  reference_virement text,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);

create table public.stock_items (
  id              uuid primary key default uuid_generate_v4(),
  cabinet_id      uuid not null references public.cabinets(id) on delete cascade,
  name            text not null,
  reference       text,
  barcode         text,
  category        text,
  quantity        integer not null default 0 check (quantity >= 0),
  unit            text not null default 'unité',
  alert_threshold integer not null default 5,
  location        text,
  supplier        text,
  unit_price      numeric(8,2),
  qr_code         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.stock_movements (
  id         uuid primary key default uuid_generate_v4(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  item_id    uuid not null references public.stock_items(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null check (type in ('in','out','adjustment','waste')),
  quantity   integer not null,
  note       text,
  created_at timestamptz not null default now()
);

create table public.fiches_soins (
  id                   uuid primary key default uuid_generate_v4(),
  cabinet_id           uuid not null references public.cabinets(id) on delete cascade,
  patient_id           uuid not null references public.patients(id) on delete cascade,
  created_by           uuid not null references public.users(id) on delete cascade,
  actes                jsonb not null default '[]',
  medecin_prescripteur text,
  ordonnance_date      date,
  valid_until          date,
  numero_ordonnance    text,
  notes                text,
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  title      text not null,
  body       text not null,
  type       text not null default 'info' check (type in ('info','warning','success','error')),
  read       boolean not null default false,
  link       text,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.plaies (
  id           uuid primary key default uuid_generate_v4(),
  cabinet_id   uuid not null references public.cabinets(id) on delete cascade,
  patient_id   uuid not null references public.patients(id) on delete cascade,
  nurse_id     uuid not null references public.users(id) on delete cascade,
  localisation text not null,
  type_plaie   text,
  surface_cm2  numeric(6,2),
  profondeur   text,
  aspect       text,
  odeur        text,
  exsudat      text,
  photos       text[],
  notes        text,
  statut       text not null default 'active' check (statut in ('active','healing','closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.plaies_suivi (
  id          uuid primary key default uuid_generate_v4(),
  plaie_id    uuid not null references public.plaies(id) on delete cascade,
  nurse_id    uuid not null references public.users(id) on delete cascade,
  date        date not null,
  surface_cm2 numeric(6,2),
  aspect      text,
  photos      text[],
  notes       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- SECTION 4 : INDEXES
-- ============================================================

create index idx_patients_cabinet_active on public.patients (cabinet_id, active);
create index idx_patients_name_trgm on public.patients using gin (
  (last_name || ' ' || first_name) gin_trgm_ops
);

create index idx_visits_cabinet_date on public.visits (cabinet_id, date);
create index idx_visits_nurse_date on public.visits (nurse_id, date);
create index idx_visits_patient_status on public.visits (patient_id, status);

create index idx_transmissions_cabinet_created on public.transmissions (cabinet_id, created_at desc);
create index idx_transmissions_patient on public.transmissions (patient_id);

create index idx_notifications_user_read_created on public.notifications (user_id, read, created_at desc);

create index idx_messages_recipient_read on public.messages (recipient_id, read);
create index idx_messages_sender on public.messages (sender_id);

-- ============================================================
-- SECTION 5 : TRIGGER UPDATED_AT
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_cabinets_updated_at
  before update on public.cabinets
  for each row execute function public.set_updated_at();

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

create trigger trg_visits_updated_at
  before update on public.visits
  for each row execute function public.set_updated_at();

create trigger trg_soin_notes_updated_at
  before update on public.soin_notes
  for each row execute function public.set_updated_at();

create trigger trg_contrats_updated_at
  before update on public.contrats
  for each row execute function public.set_updated_at();

create trigger trg_stock_items_updated_at
  before update on public.stock_items
  for each row execute function public.set_updated_at();

create trigger trg_fiches_soins_updated_at
  before update on public.fiches_soins
  for each row execute function public.set_updated_at();

create trigger trg_plaies_updated_at
  before update on public.plaies
  for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 6 : FONCTION HELPER
-- ============================================================

create or replace function public.my_cabinet_id()
returns uuid language sql stable security definer set search_path = public as $$
  select cabinet_id from public.users where id = auth.uid()
$$;

-- ============================================================
-- SECTION 7 : RLS
-- ============================================================

alter table public.cabinets enable row level security;
alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.soin_notes enable row level security;
alter table public.transmissions enable row level security;
alter table public.messages enable row level security;
alter table public.sms_logs enable row level security;
alter table public.contrats enable row level security;
alter table public.retrocessions enable row level security;
alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.fiches_soins enable row level security;
alter table public.notifications enable row level security;
alter table public.plaies enable row level security;
alter table public.plaies_suivi enable row level security;

-- ------------------------------------------------------------
-- cabinets
-- ------------------------------------------------------------

create policy "cabinets_select_members"
  on public.cabinets for select
  using (
    id in (select cabinet_id from public.users where id = auth.uid())
  );

create policy "cabinets_insert_registration"
  on public.cabinets for insert
  to anon, authenticated
  with check (true);

create policy "cabinets_update_admin"
  on public.cabinets for update
  using (
    id in (
      select cabinet_id from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------

create policy "users_select_cabinet"
  on public.users for select
  using (
    cabinet_id = public.my_cabinet_id()
  );

create policy "users_insert_registration"
  on public.users for insert
  to anon, authenticated
  with check (
    exists (select 1 from auth.users where id = users.id)
  );

create policy "users_update_self_or_admin"
  on public.users for update
  using (
    id = auth.uid()
    or (
      cabinet_id = public.my_cabinet_id()
      and exists (
        select 1 from public.users u
        where u.id = auth.uid()
          and u.role in ('admin','titulaire')
      )
    )
  );

-- ------------------------------------------------------------
-- patients
-- ------------------------------------------------------------

create policy "patients_select_cabinet"
  on public.patients for select
  using (cabinet_id = public.my_cabinet_id());

create policy "patients_insert_cabinet"
  on public.patients for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "patients_update_cabinet"
  on public.patients for update
  using (cabinet_id = public.my_cabinet_id());

create policy "patients_delete_admin"
  on public.patients for delete
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

-- ------------------------------------------------------------
-- visits
-- ------------------------------------------------------------

create policy "visits_select_cabinet"
  on public.visits for select
  using (cabinet_id = public.my_cabinet_id());

create policy "visits_insert_cabinet"
  on public.visits for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "visits_update_cabinet"
  on public.visits for update
  using (cabinet_id = public.my_cabinet_id());

create policy "visits_delete_admin"
  on public.visits for delete
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

-- ------------------------------------------------------------
-- soin_notes
-- ------------------------------------------------------------

create policy "soin_notes_select_cabinet"
  on public.soin_notes for select
  using (cabinet_id = public.my_cabinet_id());

create policy "soin_notes_insert_cabinet"
  on public.soin_notes for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "soin_notes_update_author_or_admin"
  on public.soin_notes for update
  using (
    nurse_id = auth.uid()
    or (
      cabinet_id = public.my_cabinet_id()
      and exists (
        select 1 from public.users
        where id = auth.uid()
          and role in ('admin','titulaire')
      )
    )
  );

-- ------------------------------------------------------------
-- transmissions
-- ------------------------------------------------------------

create policy "transmissions_select_cabinet"
  on public.transmissions for select
  using (cabinet_id = public.my_cabinet_id());

create policy "transmissions_insert_cabinet"
  on public.transmissions for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "transmissions_update_cabinet"
  on public.transmissions for update
  using (cabinet_id = public.my_cabinet_id());

create policy "transmissions_delete_author_or_admin"
  on public.transmissions for delete
  using (
    author_id = auth.uid()
    or (
      cabinet_id = public.my_cabinet_id()
      and exists (
        select 1 from public.users
        where id = auth.uid()
          and role in ('admin','titulaire')
      )
    )
  );

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------

create policy "messages_select_participants"
  on public.messages for select
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or recipient_id is null
  );

create policy "messages_insert_cabinet"
  on public.messages for insert
  with check (
    cabinet_id = public.my_cabinet_id()
    and sender_id = auth.uid()
  );

create policy "messages_update_recipient"
  on public.messages for update
  using (recipient_id = auth.uid());

-- ------------------------------------------------------------
-- sms_logs
-- ------------------------------------------------------------

create policy "sms_logs_select_cabinet"
  on public.sms_logs for select
  using (cabinet_id = public.my_cabinet_id());

create policy "sms_logs_insert_cabinet"
  on public.sms_logs for insert
  with check (cabinet_id = public.my_cabinet_id());

-- ------------------------------------------------------------
-- contrats
-- ------------------------------------------------------------

create policy "contrats_select_cabinet"
  on public.contrats for select
  using (cabinet_id = public.my_cabinet_id());

create policy "contrats_insert_admin"
  on public.contrats for insert
  with check (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

create policy "contrats_update_admin"
  on public.contrats for update
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

create policy "contrats_delete_admin"
  on public.contrats for delete
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

-- ------------------------------------------------------------
-- retrocessions
-- ------------------------------------------------------------

create policy "retrocessions_select_admin"
  on public.retrocessions for select
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

create policy "retrocessions_insert_admin"
  on public.retrocessions for insert
  with check (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

create policy "retrocessions_update_admin"
  on public.retrocessions for update
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

create policy "retrocessions_delete_admin"
  on public.retrocessions for delete
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

-- ------------------------------------------------------------
-- stock_items
-- ------------------------------------------------------------

create policy "stock_items_select_cabinet"
  on public.stock_items for select
  using (cabinet_id = public.my_cabinet_id());

create policy "stock_items_insert_cabinet"
  on public.stock_items for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "stock_items_update_cabinet"
  on public.stock_items for update
  using (cabinet_id = public.my_cabinet_id());

create policy "stock_items_delete_cabinet"
  on public.stock_items for delete
  using (cabinet_id = public.my_cabinet_id());

-- ------------------------------------------------------------
-- stock_movements
-- ------------------------------------------------------------

create policy "stock_movements_select_cabinet"
  on public.stock_movements for select
  using (cabinet_id = public.my_cabinet_id());

create policy "stock_movements_insert_cabinet"
  on public.stock_movements for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "stock_movements_update_cabinet"
  on public.stock_movements for update
  using (cabinet_id = public.my_cabinet_id());

create policy "stock_movements_delete_cabinet"
  on public.stock_movements for delete
  using (cabinet_id = public.my_cabinet_id());

-- ------------------------------------------------------------
-- fiches_soins
-- ------------------------------------------------------------

create policy "fiches_soins_select_cabinet"
  on public.fiches_soins for select
  using (cabinet_id = public.my_cabinet_id());

create policy "fiches_soins_insert_cabinet"
  on public.fiches_soins for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "fiches_soins_update_cabinet"
  on public.fiches_soins for update
  using (cabinet_id = public.my_cabinet_id());

create policy "fiches_soins_delete_cabinet"
  on public.fiches_soins for delete
  using (cabinet_id = public.my_cabinet_id());

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------

create policy "notifications_select_self"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_insert_cabinet"
  on public.notifications for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "notifications_update_self"
  on public.notifications for update
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- plaies
-- ------------------------------------------------------------

create policy "plaies_select_cabinet"
  on public.plaies for select
  using (cabinet_id = public.my_cabinet_id());

create policy "plaies_insert_cabinet"
  on public.plaies for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "plaies_update_cabinet"
  on public.plaies for update
  using (cabinet_id = public.my_cabinet_id());

create policy "plaies_delete_admin"
  on public.plaies for delete
  using (
    cabinet_id = public.my_cabinet_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('admin','titulaire')
    )
  );

-- ------------------------------------------------------------
-- plaies_suivi
-- ------------------------------------------------------------

create policy "plaies_suivi_select_cabinet"
  on public.plaies_suivi for select
  using (
    exists (
      select 1 from public.plaies p
      where p.id = plaies_suivi.plaie_id
        and p.cabinet_id = public.my_cabinet_id()
    )
  );

create policy "plaies_suivi_insert_cabinet"
  on public.plaies_suivi for insert
  with check (
    exists (
      select 1 from public.plaies p
      where p.id = plaies_suivi.plaie_id
        and p.cabinet_id = public.my_cabinet_id()
    )
  );

create policy "plaies_suivi_update_cabinet"
  on public.plaies_suivi for update
  using (
    exists (
      select 1 from public.plaies p
      where p.id = plaies_suivi.plaie_id
        and p.cabinet_id = public.my_cabinet_id()
    )
  );

create policy "plaies_suivi_delete_admin"
  on public.plaies_suivi for delete
  using (
    exists (
      select 1 from public.plaies p
      join public.users u on u.id = auth.uid()
      where p.id = plaies_suivi.plaie_id
        and p.cabinet_id = public.my_cabinet_id()
        and u.role in ('admin','titulaire')
    )
  );

-- ============================================================
-- SECTION 8 : FONCTION D'INSCRIPTION
-- ============================================================

create or replace function public.register_cabinet_and_profile(
  p_user_id         uuid,
  p_full_name       text,
  p_email           text,
  p_rpps            text,
  p_cabinet_name    text,
  p_cabinet_address text,
  p_cabinet_phone   text,
  p_cabinet_siret   text,
  p_cabinet_finess  text default null
)
returns json language plpgsql set search_path = public as $$
declare
  v_cabinet_id uuid;
begin
  -- Vérifier que le user existe dans auth.users
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found: user % does not exist in auth.users', p_user_id;
  end if;

  -- Vérifier unicité du SIRET
  if exists (select 1 from public.cabinets where siret = p_cabinet_siret) then
    raise exception 'siret_already_exists: SIRET % is already registered', p_cabinet_siret;
  end if;

  -- Créer le cabinet
  insert into public.cabinets (name, address, phone, siret, finess)
  values (p_cabinet_name, p_cabinet_address, p_cabinet_phone, p_cabinet_siret, p_cabinet_finess)
  returning id into v_cabinet_id;

  -- Créer le profil utilisateur
  insert into public.users (id, cabinet_id, full_name, email, rpps, role)
  values (p_user_id, v_cabinet_id, p_full_name, p_email, p_rpps, 'titulaire');

  return json_build_object(
    'cabinet_id', v_cabinet_id,
    'user_id', p_user_id
  );
end;
$$;

grant execute on function public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
) to anon, authenticated;

-- ============================================================
-- SECTION 9 : REALTIME
-- ============================================================

alter publication supabase_realtime add table public.transmissions;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.visits;

-- ============================================================
-- SECTION 10 : VÉRIFICATION
-- ============================================================

select tablename from pg_tables where schemaname = 'public' order by tablename;
