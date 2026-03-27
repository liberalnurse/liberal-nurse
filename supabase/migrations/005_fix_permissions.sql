-- ============================================================
-- Migration 005 — Fix permissions : SECURITY DEFINER + GRANTs tables
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================
-- Problème : "permission denied for table users"
-- Cause 1 : la fonction register_cabinet_and_profile n'a pas SECURITY DEFINER
--           → elle s'exécute comme anon/authenticated qui n'ont pas les droits
--           INSERT sur public.users / public.cabinets
-- Cause 2 : aucun GRANT sur les tables → toute l'app échouerait aussi
-- Solution :
--   • SECURITY DEFINER → la fonction s'exécute comme postgres (propriétaire
--     des tables). Sans FORCE ROW LEVEL SECURITY, postgres bypass le RLS.
--   • GRANTs sur toutes les tables pour les opérations normales de l'app.
-- ============================================================


-- ─── 1. Recréer register_cabinet_and_profile en SECURITY DEFINER ─────────────
--
-- postgres est propriétaire de toutes les tables créées dans la migration.
-- ENABLE ROW LEVEL SECURITY ≠ FORCE ROW LEVEL SECURITY → le propriétaire bypass RLS.
-- Donc SECURITY DEFINER + propriétaire = aucune erreur de permission ni de RLS.
--
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
security definer                      -- ← clé du fix : s'exécute comme postgres
set search_path = public              -- protection contre search_path injection
as $$
declare
  v_cabinet_id uuid;
begin
  -- Vérifier que l'utilisateur existe bien dans auth.users
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found: user % does not exist in auth.users', p_user_id;
  end if;

  -- Vérifier l'unicité du SIRET
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
    'user_id',    p_user_id
  );
end;
$$;

-- Re-accorder EXECUTE (obligatoire après CREATE OR REPLACE quand les droits changent)
revoke all on function public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
) from public;

grant execute on function public.register_cabinet_and_profile(
  uuid, text, text, text, text, text, text, text, text
) to anon, authenticated;


-- ─── 2. Prérequis : accès au schéma public ───────────────────────────────────
grant usage on schema public to anon, authenticated;


-- ─── 3. GRANTs tables pour authenticated (utilisateurs connectés) ─────────────
-- RLS assure le filtrage par cabinet_id — les GRANTs permettent seulement l'accès
grant select, insert, update, delete on public.cabinets        to authenticated;
grant select, insert, update, delete on public.users           to authenticated;
grant select, insert, update, delete on public.patients        to authenticated;
grant select, insert, update, delete on public.visits          to authenticated;
grant select, insert, update, delete on public.soin_notes      to authenticated;
grant select, insert, update, delete on public.transmissions   to authenticated;
grant select, insert, update, delete on public.messages        to authenticated;
grant select, insert, update, delete on public.sms_logs        to authenticated;
grant select, insert, update, delete on public.contrats        to authenticated;
grant select, insert, update, delete on public.retrocessions   to authenticated;
grant select, insert, update, delete on public.stock_items     to authenticated;
grant select, insert, update, delete on public.stock_movements to authenticated;
grant select, insert, update, delete on public.fiches_soins    to authenticated;
grant select, insert, update, delete on public.notifications   to authenticated;
grant select, insert, update, delete on public.plaies          to authenticated;
grant select, insert, update, delete on public.plaies_suivi    to authenticated;


-- ─── 4. GRANTs séquences ─────────────────────────────────────────────────────
grant usage, select on all sequences in schema public to anon, authenticated;


-- ─── 5. Vérification ─────────────────────────────────────────────────────────
-- Après exécution, vérifiez dans : Authentication > Policies > public.users
-- que la politique "users_insert_registration" est toujours présente.
-- Elle n'est plus utilisée pendant l'inscription (car SECURITY DEFINER bypass RLS)
-- mais reste utile pour les insertions directes futures depuis le client.
do $$
begin
  raise notice '✓ Migration 005 appliquée avec succès';
  raise notice '  • register_cabinet_and_profile → SECURITY DEFINER';
  raise notice '  • GRANTs accordés sur 16 tables pour authenticated';
  raise notice '  • GRANTs séquences accordés pour anon, authenticated';
end;
$$;
