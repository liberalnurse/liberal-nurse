-- ============================================================
-- Migration 006 — Planning assignments + index patients
-- ============================================================

-- Index manquant sur patients(cabinet_id)
create index if not exists patients_cabinet_idx
  on public.patients(cabinet_id);

-- ─── Table planning_assignments ──────────────────────────────────────────────

create table if not exists public.planning_assignments (
  id             uuid        primary key default uuid_generate_v4(),
  cabinet_id     uuid        not null references public.cabinets(id)  on delete cascade,
  infirmiere_id  uuid        not null references public.users(id)     on delete cascade,
  date           date        not null,
  tournee        text        not null check (tournee in ('T1','T2','T3')),
  created_at     timestamptz not null default now(),
  constraint planning_assignments_unique
    unique (cabinet_id, infirmiere_id, date, tournee)
);

create index if not exists planning_assignments_month_idx
  on public.planning_assignments(cabinet_id, date);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.planning_assignments enable row level security;

create policy "planning_select"
  on public.planning_assignments for select
  using (
    cabinet_id = (select cabinet_id from public.users where id = auth.uid())
  );

create policy "planning_insert"
  on public.planning_assignments for insert
  with check (
    cabinet_id = (select cabinet_id from public.users where id = auth.uid())
  );

create policy "planning_delete"
  on public.planning_assignments for delete
  using (
    cabinet_id = (select cabinet_id from public.users where id = auth.uid())
  );
