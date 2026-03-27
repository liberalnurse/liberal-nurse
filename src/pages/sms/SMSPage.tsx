// Page SMS — envoi de SMS aux patients
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

interface SmsLog {
  id: string
  patient: string
  phone: string
  content: string
  status: 'sent' | 'failed' | 'pending'
  sent_at: string
}

const mockSmsLogs: SmsLog[] = [
  { id: '1', patient: 'Marie Dupont',    phone: '06 12 34 56 78', content: 'Rappel : visite demain matin à 8h00. Cabinet Infirmier Lyon.', status: 'sent',    sent_at: '2024-01-14 17:00' },
  { id: '2', patient: 'Jean Martin',     phone: '06 23 45 67 89', content: 'Votre ordonnance est prête. Merci de nous contacter.', status: 'sent',    sent_at: '2024-01-14 16:30' },
  { id: '3', patient: 'Henri Leblanc',   phone: '06 45 67 89 01', content: 'Rappel RDV prise de sang demain 07:30.', status: 'failed',  sent_at: '2024-01-14 15:00' },
  { id: '4', patient: 'Paulette Renard', phone: '07 34 56 78 90', content: 'Rappel : visite demain matin à 10h15.', status: 'sent',    sent_at: '2024-01-13 18:00' },
]

const templates = [
  'Rappel : visite demain matin à {heure}. Cabinet Infirmier.',
  'Votre ordonnance est prête. Merci de nous contacter au cabinet.',
  'Rappel RDV prise de sang demain à {heure}. À jeun obligatoire.',
  'Votre prochain rendez-vous est le {date} à {heure}.',
]

const statusConfig = {
  sent:    { label: 'Envoyé',   cls: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  failed:  { label: 'Échec',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  pending: { label: 'En cours', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
}

export default function SMSPage() {
  const [form, setForm] = useState({ phone: '', patient: '', content: '' })
  const [logs, setLogs] = useState(mockSmsLogs)
  const [sending, setSending] = useState(false)

  const charCount = form.content.length
  const smsCount = Math.ceil(charCount / 160) || 1

  const handleSend = async () => {
    if (!form.phone || !form.content) return
    setSending(true)
    await new Promise((r) => setTimeout(r, 1200))
    const newLog: SmsLog = {
      id: String(Date.now()),
      patient: form.patient || form.phone,
      phone: form.phone,
      content: form.content,
      status: 'sent',
      sent_at: new Date().toLocaleString('fr-FR').slice(0, 16),
    }
    setLogs((prev) => [newLog, ...prev])
    setForm({ phone: '', patient: '', content: '' })
    setSending(false)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="SMS" subtitle="Envoi de messages aux patients" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Nouveau SMS</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Numéro de téléphone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="06 XX XX XX XX"
            />
            <Input
              label="Patient (optionnel)"
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
              placeholder="Nom du patient"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Modèles</label>
              <div className="flex flex-wrap gap-2">
                {templates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setForm({ ...form, content: t })}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Modèle {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Textarea
                label="Message"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="Votre message..."
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {charCount} caractères · {smsCount} SMS
              </p>
            </div>
            <Button className="w-full" onClick={handleSend} disabled={!form.phone || !form.content || sending}>
              {sending ? 'Envoi...' : 'Envoyer le SMS'}
            </Button>
          </CardBody>
        </Card>

        {/* Historique */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Historique</h2>
          </CardHeader>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {logs.map((log) => {
              const st = statusConfig[log.status]
              return (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{log.patient}</p>
                      <p className="text-xs text-gray-400">{log.phone}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{log.content}</p>
                    </div>
                    <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', st.cls)}>{st.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{log.sent_at}</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
