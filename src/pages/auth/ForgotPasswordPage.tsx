import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout quote="Votre sécurité est notre priorité.">
        <div className="space-y-6 text-center">
          {/* Icône */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-900">
            <svg className="h-8 w-8 text-navy-700 dark:text-navy-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-navy-800 dark:text-white">
              E-mail envoyé !
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Un lien de réinitialisation a été envoyé à{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{getValues('email')}</span>.
              <br />
              Vérifiez aussi vos spams.
            </p>
          </div>

          {/* Indicateur délai */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Le lien est valable <strong>1 heure</strong>. Après expiration, relancez la procédure.
          </div>

          <div className="space-y-2">
            <Button fullWidth onClick={() => setSent(false)} variant="secondary">
              Renvoyer l'e-mail
            </Button>
            <Link to="/login">
              <Button fullWidth variant="ghost">
                Retour à la connexion
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout quote="Un petit oubli ? Ça arrive à tout le monde.">
      <div className="space-y-8">
        {/* En-tête */}
        <div className="space-y-1">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 dark:hover:text-navy-300 mb-3">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Retour à la connexion
          </Link>
          <h1 className="font-display text-3xl font-semibold text-navy-800 dark:text-white">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Renseignez votre e-mail et nous vous enverrons un lien de réinitialisation.
          </p>
        </div>

        {/* Erreur serveur */}
        {serverError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            {serverError}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Adresse e-mail"
            type="email"
            autoComplete="email"
            placeholder="marie.dupont@cabinet.fr"
            error={errors.email?.message}
            required
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            }
            {...register('email')}
          />

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            {isSubmitting ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Vous n'avez pas de compte ?{' '}
          <Link to="/register" className="font-medium text-navy-700 hover:underline dark:text-navy-400">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
