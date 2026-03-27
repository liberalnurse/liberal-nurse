-- ============================================================
-- LIBERAL NURSE — Migration complète
-- À exécuter dans Supabase SQL Editor en une seule fois
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- recherche full-text patients

-- ============================================================
-- 1. CABINETS
-- ============================================================
create table public.cabinets (
  id                      uuid primary key default uuid_generate_v4(),
  name                    text not null,
  address                 text not null,
  phone                   text not null,
  email                   text,
  siret                   text not null,
  finess                  text,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    text not null default 'trial'
                            check (plan in ('trial','starter','pro','enterprise')),
  plan_expires_at         timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ============================================================
-- 2. USERS (profils — étend auth.users)
-- ============================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  role        text not null default 'titulaire'
                check (role in (
                  'admin','titulaire','collaboratrice','remplacante',
                  'stagiaire','coordinatrice_had','secretaire','medecin_partenaire'
                )),
  rpps        text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- 3. PATIENTS
-- ============================================================
create table public.patients (
  id                  uuid primary key default uuid_generate_v4(),
  cabinet_id          uuid not null references public.cabinets(id) on delete cascade,
  last_name           text not null,
  first_name          text not null,
  birth_date          date,
  gender              text check (gender in ('M','F','autre')),
  address             text,
  lat                 double precision,
  lng                 double precision,
  phone               text,
  phone_emergency     text,
  emergency_contact   text,
  nir                 text,          -- numéro sécurité sociale
  mutuelle            text,
  medecin_id          uuid,          -- référence optionnelle vers un médecin partenaire
  notes               text,
  active              boolean not null default true,
  created_by          uuid references public.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index recherche full-text sur nom/prénom
create index patients_name_idx on public.patients
  using gin ((last_name || ' ' || first_name) gin_trgm_ops);

-- ============================================================
-- 4. VISITS (planning)
-- ============================================================
create table public.visits (
  id          uuid primary key default uuid_generate_v4(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  patient_id  uuid not null references public.patients(id) on delete cascade,
  nurse_id    uuid not null references public.users(id),
  date        date not null,
  time_slot   text check (time_slot in ('morning','afternoon','evening','night')),
  start_time  time,
  end_time    time,
  status      text not null default 'planned'
                check (status in ('planned','done','cancelled','absent')),
  acte_codes  text[],       -- codes NGAP
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index visits_date_idx      on public.visits(cabinet_id, date);
create index visits_nurse_idx     on public.visits(nurse_id, date);
create index visits_patient_idx   on public.visits(patient_id);

-- ============================================================
-- 5. SOIN NOTES (notes de soins)
-- ============================================================
create table public.soin_notes (
  id          uuid primary key default uuid_generate_v4(),
  visit_id    uuid references public.visits(id) on delete set null,
  patient_id  uuid not null references public.patients(id) on delete cascade,
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  nurse_id    uuid not null references public.users(id),
  content     text not null,
  signed_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index soin_notes_patient_idx on public.soin_notes(patient_id);

-- ============================================================
-- 6. TRANSMISSIONS
-- ============================================================
create table public.transmissions (
  id          uuid primary key default uuid_generate_v4(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  patient_id  uuid references public.patients(id) on delete set null,
  author_id   uuid not null references public.users(id),
  content     text not null,
  priority    text not null default 'normal'
                check (priority in ('low','normal','high','urgent')),
  read_by     uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index transmissions_cabinet_idx on public.transmissions(cabinet_id, created_at desc);

-- ============================================================
-- 7. MESSAGES (messagerie interne)
-- ============================================================
create table public.messages (
  id            uuid primary key default uuid_generate_v4(),
  cabinet_id    uuid not null references public.cabinets(id) on delete cascade,
  sender_id     uuid not null references public.users(id),
  recipient_id  uuid references public.users(id),  -- null = broadcast cabinet
  subject       text,
  content       text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index messages_recipient_idx on public.messages(recipient_id, created_at desc);

-- ============================================================
-- 8. SMS LOGS
-- ============================================================
create table public.sms_logs (
  id          uuid primary key default uuid_generate_v4(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  sender_id   uuid references public.users(id),
  patient_id  uuid references public.patients(id) on delete set null,
  phone_to    text not null,
  content     text not null,
  status      text not null default 'pending'
                check (status in ('pending','sent','failed')),
  twilio_sid  text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 9. CONTRATS (remplacements)
-- ============================================================
create table public.contrats (
  id              uuid primary key default uuid_generate_v4(),
  cabinet_id      uuid not null references public.cabinets(id) on delete cascade,
  titulaire_id    uuid not null references public.users(id),
  remplacante_id  uuid references public.users(id),
  date_debut      date not null,
  date_fin        date not null,
  retrocession    numeric(5,2) not null default 0
                    check (retrocession >= 0 and retrocession <= 100), -- %
  honoraires      numeric(10,2),
  motif           text,
  statut          text not null default 'draft'
                    check (statut in ('draft','signed','active','terminated')),
  document_url    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 10. RETROCESSIONS
-- ============================================================
create table public.retrocessions (
  id              uuid primary key default uuid_generate_v4(),
  cabinet_id      uuid not null references public.cabinets(id) on delete cascade,
  contrat_id      uuid references public.contrats(id) on delete set null,
  remplacante_id  uuid not null references public.users(id),
  periode_debut   date not null,
  periode_fin     date not null,
  montant_brut    numeric(10,2) not null,
  taux            numeric(5,2)  not null,
  montant_net     numeric(10,2) not null,
  statut          text not null default 'pending'
                    check (statut in ('pending','paid','cancelled')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 11. STOCK MATÉRIEL
-- ============================================================
create table public.stock_items (
  id             uuid primary key default uuid_generate_v4(),
  cabinet_id     uuid not null references public.cabinets(id) on delete cascade,
  name           text not null,
  reference      text,
  category       text,
  quantity       integer not null default 0 check (quantity >= 0),
  unit           text not null default 'unité',
  alert_threshold integer not null default 5,
  location       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.stock_movements (
  id          uuid primary key default uuid_generate_v4(),
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  item_id     uuid not null references public.stock_items(id) on delete cascade,
  user_id     uuid references public.users(id),
  type        text not null check (type in ('in','out','adjustment')),
  quantity    integer not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 12. FICHES SOINS (templates / ordonnances)
-- ============================================================
create table public.fiches_soins (
  id           uuid primary key default uuid_generate_v4(),
  cabinet_id   uuid not null references public.cabinets(id) on delete cascade,
  patient_id   uuid not null references public.patients(id) on delete cascade,
  created_by   uuid references public.users(id),
  actes        jsonb not null default '[]', -- [{code, libelle, qte}]
  medecin      text,
  ordonnance_date date,
  valid_until  date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  cabinet_id  uuid not null references public.cabinets(id) on delete cascade,
  title       text not null,
  body        text not null,
  type        text not null default 'info'
                check (type in ('info','warning','success','error')),
  read        boolean not null default false,
  link        text,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, read, created_at desc);

-- ============================================================
-- 14. FONCTION updated_at automatique
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers updated_at
create trigger set_updated_at before update on public.cabinets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.visits
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.soin_notes
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.contrats
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.stock_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.fiches_soins
  for each row execute function public.set_updated_at();

-- ============================================================
-- 15. FONCTION helper — cabinet de l'utilisateur connecté
-- ============================================================
create or replace function public.my_cabinet_id()
returns uuid language sql stable as $$
  select cabinet_id from public.users where id = auth.uid()
$$;

-- ============================================================
-- 16. ROW LEVEL SECURITY
-- ============================================================

alter table public.cabinets       enable row level security;
alter table public.users          enable row level security;
alter table public.patients       enable row level security;
alter table public.visits         enable row level security;
alter table public.soin_notes     enable row level security;
alter table public.transmissions  enable row level security;
alter table public.messages       enable row level security;
alter table public.sms_logs       enable row level security;
alter table public.contrats       enable row level security;
alter table public.retrocessions  enable row level security;
alter table public.stock_items    enable row level security;
alter table public.stock_movements enable row level security;
alter table public.fiches_soins   enable row level security;
alter table public.notifications  enable row level security;

-- ── cabinets ──
create policy "cabinet: membres peuvent lire"
  on public.cabinets for select
  using (id = public.my_cabinet_id());

create policy "cabinet: admin peut modifier"
  on public.cabinets for update
  using (id = public.my_cabinet_id()
    and exists (select 1 from public.users
                where id = auth.uid() and role in ('admin','titulaire')));

-- ── users ──
create policy "users: lecture même cabinet"
  on public.users for select
  using (cabinet_id = public.my_cabinet_id());

create policy "users: insertion lors inscription"
  on public.users for insert
  with check (id = auth.uid());

create policy "users: modifier son propre profil"
  on public.users for update
  using (id = auth.uid());

create policy "users: admin peut modifier tous"
  on public.users for update
  using (cabinet_id = public.my_cabinet_id()
    and exists (select 1 from public.users
                where id = auth.uid() and role in ('admin','titulaire')));

-- ── patients ──
create policy "patients: lecture même cabinet"
  on public.patients for select
  using (cabinet_id = public.my_cabinet_id());

create policy "patients: insertion même cabinet"
  on public.patients for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "patients: modification même cabinet"
  on public.patients for update
  using (cabinet_id = public.my_cabinet_id());

create policy "patients: suppression titulaire/admin"
  on public.patients for delete
  using (cabinet_id = public.my_cabinet_id()
    and exists (select 1 from public.users
                where id = auth.uid() and role in ('admin','titulaire')));

-- ── visits ──
create policy "visits: lecture même cabinet"
  on public.visits for select
  using (cabinet_id = public.my_cabinet_id());

create policy "visits: insertion même cabinet"
  on public.visits for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "visits: modification même cabinet"
  on public.visits for update
  using (cabinet_id = public.my_cabinet_id());

create policy "visits: suppression titulaire/admin"
  on public.visits for delete
  using (cabinet_id = public.my_cabinet_id()
    and exists (select 1 from public.users
                where id = auth.uid() and role in ('admin','titulaire')));

-- ── soin_notes ──
create policy "soin_notes: lecture même cabinet"
  on public.soin_notes for select
  using (cabinet_id = public.my_cabinet_id());

create policy "soin_notes: insertion même cabinet"
  on public.soin_notes for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "soin_notes: modification auteur ou admin"
  on public.soin_notes for update
  using (cabinet_id = public.my_cabinet_id()
    and (nurse_id = auth.uid()
      or exists (select 1 from public.users
                 where id = auth.uid() and role in ('admin','titulaire'))));

-- ── transmissions ──
create policy "transmissions: lecture même cabinet"
  on public.transmissions for select
  using (cabinet_id = public.my_cabinet_id());

create policy "transmissions: insertion même cabinet"
  on public.transmissions for insert
  with check (cabinet_id = public.my_cabinet_id());

create policy "transmissions: suppression auteur ou admin"
  on public.transmissions for delete
  using (cabinet_id = public.my_cabinet_id()
    and (author_id = auth.uid()
      or exists (select 1 from public.users
                 where id = auth.uid() and role in ('admin','titulaire'))));

-- ── messages ──
create policy "messages: lecture destinataire ou envoyeur"
  on public.messages for select
  using (cabinet_id = public.my_cabinet_id()
    and (sender_id = auth.uid()
      or recipient_id = auth.uid()
      or recipient_id is null));

create policy "messages: insertion même cabinet"
  on public.messages for insert
  with check (cabinet_id = public.my_cabinet_id() and sender_id = auth.uid());

-- ── sms_logs ──
create policy "sms_logs: lecture même cabinet"
  on public.sms_logs for select
  using (cabinet_id = public.my_cabinet_id());

create policy "sms_logs: insertion même cabinet"
  on public.sms_logs for insert
  with check (cabinet_id = public.my_cabinet_id());

-- ── contrats ──
create policy "contrats: lecture même cabinet"
  on public.contrats for select
  using (cabinet_id = public.my_cabinet_id());

create policy "contrats: insertion titulaire/admin"
  on public.contrats for insert
  with check (cabinet_id = public.my_cabinet_id()
    and exists (select 1 from public.users
                where id = auth.uid() and role in ('admin','titulaire')));

create policy "contrats: modification titulaire/admin"
  on public.contrats for update
  using (cabinet_id = public.my_cabinet_id()
    and exists (select 1 from public.users
                where id = auth.uid() and role in ('admin','titulaire')));

-- ── retrocessions ──
create policy "retrocessions: lecture même cabinet"
  on public.retrocessions for select
  using (cabinet_id = public.my_cabinet_id());

create policy "retrocessions: gestion titulaire/admin"
  on public.retrocessions for all
  using (cabinet_id = public.my_cabinet_id()
    and exists (select 1 from public.users
                where id = auth.uid() and role in ('admin','titulaire')));

-- ── stock ──
create policy "stock_items: lecture même cabinet"
  on public.stock_items for select
  using (cabinet_id = public.my_cabinet_id());

create policy "stock_items: gestion même cabinet"
  on public.stock_items for all
  using (cabinet_id = public.my_cabinet_id());

create policy "stock_movements: lecture même cabinet"
  on public.stock_movements for select
  using (cabinet_id = public.my_cabinet_id());

create policy "stock_movements: insertion même cabinet"
  on public.stock_movements for insert
  with check (cabinet_id = public.my_cabinet_id());

-- ── fiches_soins ──
create policy "fiches_soins: lecture même cabinet"
  on public.fiches_soins for select
  using (cabinet_id = public.my_cabinet_id());

create policy "fiches_soins: gestion même cabinet"
  on public.fiches_soins for all
  using (cabinet_id = public.my_cabinet_id());

-- ── notifications ──
create policy "notifications: lecture propriétaire"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications: marquer comme lu"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "notifications: insertion même cabinet"
  on public.notifications for insert
  with check (cabinet_id = public.my_cabinet_id());

-- ============================================================
-- 17. REALTIME — tables à activer en temps réel
-- ============================================================
alter publication supabase_realtime add table public.transmissions;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.visits;

-- ============================================================
-- FIN — Migration terminée avec succès
-- ============================================================
