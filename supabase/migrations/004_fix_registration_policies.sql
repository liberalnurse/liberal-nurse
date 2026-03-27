-- ============================================================
-- Migration 004 — Fix inscription sans droits superuser
-- Supabase Cloud ne permet pas ALTER ROLE postgres BYPASSRLS.
-- Solution : policies INSERT explicites + contrainte UNIQUE SIRET.
-- ============================================================

-- 1. Contrainte UNIQUE sur SIRET (évite les doublons même sans RPC)
alter table public.cabinets
  add constraint cabinets_siret_unique unique (siret);

-- 2. Policy INSERT cabinets — autorise anon ET authenticated
--    (nécessaire car après signUp avec confirmation email,
--     auth.uid() est null = rôle anon côté base)
create policy "cabinets: insertion lors inscription"
  on public.cabinets
  for insert
  to anon, authenticated
  with check (true);

-- 3. Policy INSERT users — vérifie que l'id correspond à un vrai auth.user
--    Empêche de créer un profil pour un uuid arbitraire
drop policy if exists "users: insertion lors inscription" on public.users;

create policy "users: insertion lors inscription"
  on public.users
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from auth.users where id = users.id
    )
  );

-- 4. Recréer la fonction RPC SANS dépendre du bypass RLS
--    Elle reste utile pour : transaction atomique + validation SIRET
drop function if exists public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
);

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
returns json
language plpgsql
-- Pas de SECURITY DEFINER : les policies INSERT gèrent les permissions
set search_path = public
as $$
declare
  v_cabinet_id uuid;
begin
  -- Profil déjà existant ?
  if exists (select 1 from public.users where id = p_user_id) then
    raise exception 'Un profil existe déjà pour cet utilisateur.';
  end if;

  -- SIRET déjà utilisé ? (double protection avec la contrainte UNIQUE)
  if exists (select 1 from public.cabinets where siret = p_cabinet_siret) then
    raise exception 'Un cabinet avec ce SIRET est déjà enregistré.';
  end if;

  -- Crée le cabinet
  insert into public.cabinets (name, address, phone, siret, finess, plan)
  values (
    p_cabinet_name,
    p_cabinet_address,
    p_cabinet_phone,
    p_cabinet_siret,
    nullif(trim(coalesce(p_cabinet_finess, '')), ''),
    'trial'
  )
  returning id into v_cabinet_id;

  -- Crée le profil
  insert into public.users (id, cabinet_id, full_name, email, role, rpps)
  values (
    p_user_id,
    v_cabinet_id,
    p_full_name,
    p_email,
    'titulaire',
    nullif(trim(coalesce(p_rpps, '')), '')
  );

  return json_build_object(
    'cabinet_id', v_cabinet_id,
    'user_id',    p_user_id
  );

exception
  when unique_violation then
    raise exception 'Un cabinet avec ce SIRET est déjà enregistré.';
  when others then
    raise exception '%', sqlerrm;
end;
$$;

-- 5. Permissions d'appel de la fonction
grant execute on function public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
) to anon, authenticated;

-- ============================================================
-- Vérification
-- ============================================================
-- Doit retourner les 2 nouvelles policies :
select policyname, cmd, roles
from pg_policies
where tablename in ('cabinets', 'users')
  and cmd = 'INSERT'
order by tablename, policyname;
