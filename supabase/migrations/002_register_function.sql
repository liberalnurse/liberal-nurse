-- ============================================================
-- Migration 002 — Fonction d'inscription sécurisée
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Fonction SECURITY DEFINER : s'exécute avec les droits du propriétaire
-- de la base, contournant le RLS uniquement pour l'inscription.
-- Cela évite d'ouvrir une policy INSERT trop permissive sur cabinets.

create or replace function public.register_cabinet_and_profile(
  p_user_id        uuid,
  p_full_name      text,
  p_email          text,
  p_rpps           text,
  p_cabinet_name   text,
  p_cabinet_address text,
  p_cabinet_phone  text,
  p_cabinet_siret  text,
  p_cabinet_finess text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cabinet_id uuid;
begin
  -- Vérifie qu'un profil n'existe pas déjà pour cet utilisateur
  if exists (select 1 from public.users where id = p_user_id) then
    raise exception 'Un profil existe déjà pour cet utilisateur.';
  end if;

  -- Vérifie qu'un cabinet avec ce SIRET n'existe pas déjà
  if exists (select 1 from public.cabinets where siret = p_cabinet_siret) then
    raise exception 'Un cabinet avec ce SIRET existe déjà.';
  end if;

  -- 1. Crée le cabinet
  insert into public.cabinets (name, address, phone, siret, finess, plan)
  values (
    p_cabinet_name,
    p_cabinet_address,
    p_cabinet_phone,
    p_cabinet_siret,
    nullif(trim(p_cabinet_finess), ''),
    'trial'
  )
  returning id into v_cabinet_id;

  -- 2. Crée le profil utilisateur (titulaire par défaut)
  insert into public.users (id, cabinet_id, full_name, email, role, rpps)
  values (
    p_user_id,
    v_cabinet_id,
    p_full_name,
    p_email,
    'titulaire',
    nullif(trim(p_rpps), '')
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

-- Autorise les utilisateurs authentifiés ET anonymes à appeler cette fonction
-- (nécessaire car l'email n'est peut-être pas encore confirmé)
grant execute on function public.register_cabinet_and_profile to anon, authenticated;
