// Page sécurité — gestion du profil et mot de passe
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'

export default function SecuritePage() {
  const { user } = useAuthStore()
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    rpps: user?.rpps ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [savedPwdMsg, setSavedPwdMsg] = useState('')

  const handleSaveProfile = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSavedMsg('Profil mis à jour avec succès.')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleSavePassword = async () => {
    if (passwordForm.next !== passwordForm.confirm) {
      setSavedPwdMsg('Les mots de passe ne correspondent pas.')
      return
    }
    if (passwordForm.next.length < 8) {
      setSavedPwdMsg('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setSavingPwd(true)
    await new Promise((r) => setTimeout(r, 800))
    setSavingPwd(false)
    setPasswordForm({ current: '', next: '', confirm: '' })
    setSavedPwdMsg('Mot de passe modifié avec succès.')
    setTimeout(() => setSavedPwdMsg(''), 3000)
  }

  const sessions = [
    { id: '1', device: 'MacBook Pro — Safari',      location: 'Lyon, France',    last: "À l'instant", current: true },
    { id: '2', device: 'iPhone 14 — Chrome Mobile', location: 'Lyon, France',    last: 'Il y a 2h',   current: false },
    { id: '3', device: 'iPad Pro — Safari',          location: 'Villeurbanne, FR',last: 'Hier',        current: false },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Sécurité" subtitle="Gérez votre profil et vos accès" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profil */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Informations personnelles</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-100 text-2xl font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                {profileForm.full_name.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{profileForm.full_name || 'Nom complet'}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            <Input
              label="Nom complet"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              placeholder="Prénom Nom"
            />
            <Input
              label="Téléphone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="06 XX XX XX XX"
            />
            <Input
              label="N° RPPS"
              value={profileForm.rpps}
              onChange={(e) => setProfileForm({ ...profileForm, rpps: e.target.value })}
              placeholder="10 chiffres"
            />
            {savedMsg && <p className="text-sm text-green-600 dark:text-green-400">{savedMsg}</p>}
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </CardBody>
        </Card>

        {/* Mot de passe */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Changer le mot de passe</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Mot de passe actuel"
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              placeholder="••••••••"
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
              placeholder="8 caractères minimum"
            />
            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="••••••••"
            />
            {savedPwdMsg && (
              <p className={`text-sm ${savedPwdMsg.includes('succès') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {savedPwdMsg}
              </p>
            )}
            <Button onClick={handleSavePassword} disabled={savingPwd || !passwordForm.current || !passwordForm.next}>
              {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Sessions actives */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy-900 dark:text-white">Sessions actives</h2>
        </CardHeader>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{session.device}</p>
                  {session.current && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                      Cette session
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{session.location} · {session.last}</p>
              </div>
              {!session.current && (
                <Button variant="secondary" size="sm">
                  Révoquer
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
