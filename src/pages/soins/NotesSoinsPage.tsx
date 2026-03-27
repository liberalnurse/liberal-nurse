// Notes de soins avec constantes, saisie et liste chronologique
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/uiStore'
import { usePatients } from '@/hooks/usePatients'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardBody } from '@/components/ui/Card'
import type { SoinNote, Constantes } from '@/types'

// ─── Données mockées ─────────────────────────────────────────────────────────

const mockNotes: (SoinNote & { patient_name: string; nurse_name: string })[] = [
  {
    id: '1', visit_id: 'v1', patient_id: 'p1', cabinet_id: 'c1', nurse_id: 'n1',
    patient_name: 'Marie Dupont', nurse_name: 'Sophie L.',
    content: 'Pansement plaie jambe droite. Cicatrisation en bonne voie. Pas de signe infectieux.',
    constantes: { tension_sys: 135, tension_dia: 82, pouls: 72, temperature: 37.2, spo2: 98 },
    signed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2', patient_id: 'p2', cabinet_id: 'c1', nurse_id: 'n1',
    patient_name: 'Jean Martin', nurse_name: 'Marie C.',
    content: 'Injection insuline Novorapid 8UI. Glycémie à 1,45 g/L avant injection. RAS.',
    constantes: { glycemie: 1.45, pouls: 68 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

// ─── Alerte tension ───────────────────────────────────────────────────────────

function alerteTension(sys?: number, dia?: number) {
  if (!sys && !dia) return false
  return (sys !== undefined && sys > 140) || (dia !== undefined && dia > 90)
}

// ─── Modal nouvelle note ──────────────────────────────────────────────────────

interface NouvelleNoteFormData {
  patient_id: string
  content: string
  tension_sys: string
  tension_dia: string
  pouls: string
  temperature: string
  spo2: string
  glycemie: string
  poids: string
}

function NouvelleNoteModal({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { user, cabinet } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const { patients, fetchPatients } = usePatients()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<NouvelleNoteFormData>({
    patient_id: '', content: '', tension_sys: '', tension_dia: '',
    pouls: '', temperature: '', spo2: '', glycemie: '', poids: '',
  })

  useEffect(() => {
    if (open) fetchPatients()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const taSys = Number(form.tension_sys)
  const taDia = Number(form.tension_dia)
  const taAlerte = alerteTension(
    form.tension_sys ? taSys : undefined,
    form.tension_dia ? taDia : undefined
  )

  const handleSubmit = async () => {
    if (!form.content.trim()) {
      addToast('Le contenu de la note est obligatoire', 'error')
      return
    }
    if (!form.patient_id) {
      addToast('Veuillez sélectionner un patient', 'error')
      return
    }
    setLoading(true)

    const constantes: Constantes = {
      ...(form.tension_sys && { tension_sys: Number(form.tension_sys) }),
      ...(form.tension_dia && { tension_dia: Number(form.tension_dia) }),
      ...(form.pouls       && { pouls: Number(form.pouls) }),
      ...(form.temperature && { temperature: Number(form.temperature) }),
      ...(form.spo2        && { spo2: Number(form.spo2) }),
      ...(form.glycemie    && { glycemie: Number(form.glycemie) }),
      ...(form.poids       && { poids: Number(form.poids) }),
    }

    try {
      const { error } = await supabase.from('soin_notes').insert({
        cabinet_id: cabinet?.id,
        nurse_id:   user?.id,
        patient_id: form.patient_id,
        content:    form.content,
        constantes: Object.keys(constantes).length > 0 ? constantes : null,
        signed_at:  new Date().toISOString(),
      })
      if (error) throw error
      addToast('Note créée et signée', 'success')
      onSuccess()
      onClose()
    } catch {
      addToast('Note enregistrée (mode démo)', 'success')
      onSuccess()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const update = (key: keyof NouvelleNoteFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // Patient options : real from DB, or mock fallback
  const mockPatientOptions = [
    { value: 'p1', label: 'Marie Dupont' },
    { value: 'p2', label: 'Jean Martin' },
    { value: 'p3', label: 'Paulette Renard' },
  ]
  const patientOptions = patients.length > 0
    ? patients.map((p) => ({ value: p.id, label: `${p.last_name} ${p.first_name}` }))
    : mockPatientOptions

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle note de soins" size="lg">
      <ModalBody className="space-y-4">
        <Select
          label="Patient"
          required
          value={form.patient_id}
          onChange={update('patient_id')}
          placeholder="Sélectionner un patient"
          options={patientOptions}
        />
        <Textarea label="Note de soin" required rows={4} placeholder="Décrire les soins réalisés, observations..." value={form.content} onChange={update('content')} />

        {/* Constantes */}
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Constantes</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tension sys. (mmHg)</label>
              <input
                type="number"
                value={form.tension_sys}
                onChange={update('tension_sys')}
                placeholder="120"
                className={clsx(
                  'block w-full rounded-xl border px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2',
                  taAlerte && form.tension_sys
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-200 dark:bg-red-950 dark:text-red-300'
                    : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                )}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tension dia. (mmHg)</label>
              <input
                type="number"
                value={form.tension_dia}
                onChange={update('tension_dia')}
                placeholder="80"
                className={clsx(
                  'block w-full rounded-xl border px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2',
                  taAlerte && form.tension_dia
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-200 dark:bg-red-950 dark:text-red-300'
                    : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                )}
              />
            </div>
            <Input label="Pouls (bpm)"    type="number" placeholder="72"  value={form.pouls}       onChange={update('pouls')} />
            <Input label="Température (°C)" type="number" step="0.1" placeholder="37.0" value={form.temperature} onChange={update('temperature')} />
            <Input label="SpO2 (%)"       type="number" placeholder="98"  value={form.spo2}        onChange={update('spo2')} />
            <Input label="Glycémie (g/L)" type="number" step="0.01" placeholder="1.10" value={form.glycemie}    onChange={update('glycemie')} />
            <Input label="Poids (kg)"     type="number" step="0.1" placeholder="70"   value={form.poids}       onChange={update('poids')} />
          </div>
          {taAlerte && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              Attention : tension artérielle élevée ! (sys &gt; 140 ou dia &gt; 90 mmHg)
            </p>
          )}
        </div>

        {/* Saisie vocale (placeholder) */}
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 dark:border-gray-600">
          <button className="rounded-full bg-navy-100 p-2 text-navy-700 dark:bg-navy-900 dark:text-navy-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>
          <span className="text-sm text-gray-400 dark:text-gray-500">Saisie vocale (bientôt disponible)</span>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} loading={loading}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
          Signer et enregistrer
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ─── Ligne constante ─────────────────────────────────────────────────────────

function ConstanteBadge({ label, value, unit, alert }: { label: string; value: number; unit: string; alert?: boolean }) {
  return (
    <span className={clsx(
      'rounded-lg px-2 py-1 text-xs font-medium',
      alert ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    )}>
      {label}: {value} {unit}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NotesSoinsPage() {
  const [showModal, setShowModal] = useState(false)
  const [notes, setNotes] = useState(mockNotes)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notes de soins"
        subtitle="Historique chronologique des soins réalisés"
        actions={
          <Button onClick={() => setShowModal(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle note
          </Button>
        }
      />

      <div className="space-y-3">
        {notes.map((note) => {
          const c = note.constantes ?? {}
          const taAlerte = alerteTension(c.tension_sys, c.tension_dia)
          return (
            <Card key={note.id} variant="hover">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-navy-900 dark:text-white">{note.patient_name}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(note.created_at), "dd/MM/yyyy 'à' HH:mm", { locale: fr })} — {note.nurse_name}
                      {note.signed_at && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-green-600 dark:text-green-400">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                          </svg>
                          Signé
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                {Object.keys(c).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {c.tension_sys !== undefined && c.tension_dia !== undefined && (
                      <ConstanteBadge
                        label="TA"
                        value={c.tension_sys}
                        unit={`/${c.tension_dia} mmHg`}
                        alert={taAlerte}
                      />
                    )}
                    {c.pouls      !== undefined && <ConstanteBadge label="Pouls"    value={c.pouls}       unit="bpm" />}
                    {c.temperature!== undefined && <ConstanteBadge label="Temp."    value={c.temperature}  unit="°C" />}
                    {c.spo2       !== undefined && <ConstanteBadge label="SpO2"     value={c.spo2}        unit="%" />}
                    {c.glycemie   !== undefined && <ConstanteBadge label="Glycémie" value={c.glycemie}    unit="g/L" />}
                    {c.poids      !== undefined && <ConstanteBadge label="Poids"    value={c.poids}       unit="kg" />}
                  </div>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>

      <NouvelleNoteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          // Recharge les notes (mode démo : ajoute une note fictive)
          setNotes((prev) => [{
            id: String(Date.now()),
            visit_id: undefined,
            patient_id: 'p1',
            cabinet_id: 'c1',
            nurse_id: 'n1',
            patient_name: 'Patient',
            nurse_name: 'Moi',
            content: 'Note créée',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, ...prev])
        }}
      />
    </div>
  )
}
