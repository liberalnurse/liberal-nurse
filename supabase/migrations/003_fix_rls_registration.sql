-- ============================================================
-- Migration 003 — Fix RLS inscription
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. S'assurer que postgres peut bypasser le RLS
alter role postgres bypassrls;

-- 2. Supprimer l'ancienne version si elle existe
drop function if exists public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
);

-- 3. Recréer la fonction avec owner explicitement postgres
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
security definer
set search_path = public
as $$
declare
  v_cabinet_id uuid;
begin
  -- Vérifie qu'un profil n'existe pas déjà
  if exists (select 1 from public.users where id = p_user_id) then
    raise exception 'Un profil existe déjà pour cet utilisateur.';
  end if;

  -- Vérifie SIRET unique
  if exists (select 1 from public.cabinets where siret = p_cabinet_siret) then
    raise exception 'Un cabinet avec ce SIRET existe déjà.';
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

  -- Crée le profil utilisateur
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
  when others then
    raise exception '%', sqlerrm;
end;
$$;

-- 4. S'assurer que la fonction est bien owned par postgres
alter function public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
) owner to postgres;

-- 5. Permissions d'exécution
grant execute on function public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
) to anon, authenticated;

-- 6. Vérification finale : doit retourner prosecdef=true et proowner=postgres
select proname, prosecdef, proowner::regrole
from pg_proc
where proname = 'register_cabinet_and_profile';
