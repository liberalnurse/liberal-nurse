import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

// ── Schémas Zod ──────────────────────────────────────────────────────────────

const cabinetSchema = z.object({
  cabinet_name:    z.string().min(2, 'Minimum 2 caractères'),
  cabinet_address: z.string().min(5, 'Adresse complète requise'),
  cabinet_phone:   z.string().regex(/^(\+33|0)[0-9]{9}$/, 'Numéro français invalide'),
  cabinet_siret:   z.string().regex(/^\d{14}$/, 'SIRET : 14 chiffres exactement'),
  cabinet_finess:  z.string().regex(/^\d{9}$/, 'FINESS : 9 chiffres').optional().or(z.literal('')),
})

const accountSchema = z.object({
  full_name: z.string().min(2, 'Nom complet requis'),
  email:     z.string().email('Adresse e-mail invalide'),
  rpps:      z.string().regex(/^\d{11}$/, 'RPPS : 11 chiffres').optional().or(z.literal('')),
  password:  z.string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
})

type CabinetData = z.infer<typeof cabinetSchema>
type AccountData  = z.infer<typeof accountSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function translateError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('User already registered'))
    return 'Un compte existe déjà avec cet email.'
  if (msg.includes('SIRET existe déjà'))
    return 'Un cabinet avec ce SIRET est déjà enregistré.'
  if (msg.includes('profil existe déjà'))
    return 'Un profil existe déjà pour cet utilisateur.'
  if (msg.includes('Password should be'))
    return 'Le mot de passe doit contenir au moins 6 caractères.'
  return msg
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [cabinetData, setCabinetData] = useState<CabinetData | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const form1 = useForm<CabinetData>({ resolver: zodResolver(cabinetSchema) })
  const form2 = useForm<AccountData>({ resolver: zodResolver(accountSchema) })

  function onStep1(data: CabinetData) {
    setCabinetData(data)
    setStep(2)
    window.scrollTo(0, 0)
  }

  async function onStep2(data: AccountData) {
    if (!cabinetData) return
    setServerError(null)

    try {
      // ── Étape A : Créer le compte Auth Supabase ──
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options:  { data: { full_name: data.full_name } },
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Impossible de créer le compte.')

      // ── Étape B : Appel RPC — crée cabinet + profil en transaction atomique ──
      // La fonction SECURITY DEFINER contourne le RLS et fonctionne
      // même si la confirmation email n'a pas encore eu lieu.
      const { error: rpcError } = await supabase.rpc('register_cabinet_and_profile', {
        p_user_id:         authData.user.id,
        p_full_name:       data.full_name,
        p_email:           data.email,
        p_rpps:            data.rpps ?? '',
        p_cabinet_name:    cabinetData.cabinet_name,
        p_cabinet_address: cabinetData.cabinet_address,
        p_cabinet_phone:   cabinetData.cabinet_phone,
        p_cabinet_siret:   cabinetData.cabinet_siret,
        p_cabinet_finess:  cabinetData.cabinet_finess ?? '',
      })

      if (rpcError) throw new Error(rpcError.message)

      setSuccess(true)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.'
      setServerError(translateError(msg))
    }
  }

  // ── Écran de succès ───────────────────────────────────────────────────────

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
            <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-navy-800 dark:text-white">
              Cabinet créé !
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Un e-mail de confirmation vous a été envoyé.<br />
              Vérifiez votre boîte de réception pour activer votre compte.
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-left text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <p className="font-medium mb-1">💡 Confirmation email désactivée ?</p>
            <p>Si vous avez désactivé la confirmation dans Supabase Auth, vous pouvez vous connecter directement.</p>
          </div>
          <Button fullWidth onClick={() => navigate('/login')}>
            Aller à la connexion
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // ── Formulaire ────────────────────────────────────────────────────────────

  return (
    <AuthLayout quote="Rejoignez des centaines de cabinets infirmiers qui ont simplifié leur gestion.">
      <div className="space-y-6">

        {/* En-tête */}
        <div className="space-y-4">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 dark:hover:text-navy-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Retour à la connexion
          </Link>
          <div>
            <h1 className="font-display text-3xl font-semibold text-navy-800 dark:text-white">
              {step === 1 ? 'Votre cabinet' : 'Votre compte'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {step === 1
                ? 'Informations sur votre structure professionnelle'
                : 'Identifiants de connexion du titulaire'}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            {([1, 2] as const).map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={clsx(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  s < step  ? 'bg-emerald-500 text-white'
                  : s === step ? 'bg-navy-800 text-white dark:bg-navy-600'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                )}>
                  {s < step
                    ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    : s}
                </div>
                <span className={clsx(
                  'text-xs font-medium',
                  s === step ? 'text-navy-800 dark:text-white' : 'text-gray-400'
                )}>
                  {s === 1 ? 'Cabinet' : 'Compte'}
                </span>
                {s < 2 && (
                  <div className={clsx('flex-1 h-px', step > s ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700')} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Étape 1 : Cabinet ── */}
        {step === 1 && (
          <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4" noValidate>
            <Input
              label="Nom du cabinet"
              placeholder="Cabinet Infirmier des Lilas"
              error={form1.formState.errors.cabinet_name?.message}
              required
              {...form1.register('cabinet_name')}
            />
            <Input
              label="Adresse complète"
              placeholder="12 rue de la Paix, 75001 Paris"
              error={form1.formState.errors.cabinet_address?.message}
              required
              {...form1.register('cabinet_address')}
            />
            <Input
              label="Téléphone"
              type="tel"
              placeholder="0612345678"
              hint="Format : 06XXXXXXXX ou +336XXXXXXXX"
              error={form1.formState.errors.cabinet_phone?.message}
              required
              {...form1.register('cabinet_phone')}
            />
            <Input
              label="SIRET"
              placeholder="12345678901234"
              hint="14 chiffres — visible sur votre Kbis"
              error={form1.formState.errors.cabinet_siret?.message}
              maxLength={14}
              required
              {...form1.register('cabinet_siret')}
            />
            <Input
              label="N° FINESS (optionnel)"
              placeholder="123456789"
              hint="9 chiffres — si votre cabinet est référencé"
              error={form1.formState.errors.cabinet_finess?.message}
              maxLength={9}
              {...form1.register('cabinet_finess')}
            />
            <Button type="submit" fullWidth size="lg">
              Continuer
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Button>
          </form>
        )}

        {/* ── Étape 2 : Compte ── */}
        {step === 2 && (
          <>
            {serverError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                {serverError}
              </div>
            )}

            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4" noValidate>
              <Input
                label="Nom complet"
                placeholder="Marie Dupont"
                error={form2.formState.errors.full_name?.message}
                required
                {...form2.register('full_name')}
              />
              <Input
                label="Adresse e-mail"
                type="email"
                placeholder="marie.dupont@cabinet.fr"
                error={form2.formState.errors.email?.message}
                required
                {...form2.register('email')}
              />
              <Input
                label="N° RPPS (optionnel)"
                placeholder="10012345678"
                hint="11 chiffres — identifiant professionnel de santé"
                error={form2.formState.errors.rpps?.message}
                maxLength={11}
                {...form2.register('rpps')}
              />
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                hint="8 caractères min., 1 majuscule, 1 chiffre"
                error={form2.formState.errors.password?.message}
                required
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                    {showPassword
                      ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    }
                  </button>
                }
                {...form2.register('password')}
              />
              <Input
                label="Confirmer le mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={form2.formState.errors.confirm?.message}
                required
                {...form2.register('confirm')}
              />

              <p className="text-xs text-gray-400 dark:text-gray-500">
                En créant un compte, vous acceptez les{' '}
                <a href="#" className="text-navy-700 underline dark:text-navy-400">Conditions d'utilisation</a>
                {' '}et la{' '}
                <a href="#" className="text-navy-700 underline dark:text-navy-400">Politique de confidentialité</a>.
              </p>

              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => { setServerError(null); setStep(1) }}>
                  Retour
                </Button>
                <Button type="submit" size="lg" className="flex-1" loading={form2.formState.isSubmitting}>
                  {form2.formState.isSubmitting ? 'Création…' : 'Créer mon compte'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
