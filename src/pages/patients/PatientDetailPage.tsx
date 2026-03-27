// Fiche patient complète : 8 onglets, chargement Supabase + fallback démo
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Données de démo ──────────────────────────────────────────────────────────

const DEMO_PATIENT: Patient = {
  id: 'demo',
  cabinet_id: 'demo',
  last_name: 'Dupont',
  first_name: 'Marie',
  birth_date: '1945-03-15',
  gender: 'F',
  address: '12 rue des Lilas',
  city: 'Paris',
  postal_code: '75011',
  phone: '06 12 34 56 78',
  phone_emergency: '06 98 76 54 32',
  emergency_contact_name: 'Paul Dupont (fils)',
  nir: '2 45 03 75 011 234',
  mutuelle: 'MGEN',
  mutuelle_num: '1234567890',
  medecin_traitant: 'Dr. Martin',
  medecin_prescripteur: 'Dr. Bernard',
  pathologies: ['Diabète type 2', 'HTA'],
  allergies: ['Pénicilline'],
  notes: 'Patiente coopérative. Préférence pour les soins le matin.',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// ─── Onglets ──────────────────────────────────────────────────────────────────

type TabId = 'infos' | 'medical' | 'ordonnances' | 'soins' | 'transmissions' | 'documents' | 'historique' | 'urgence'

const TABS: { id: TabId; label: string }[] = [
  { id: 'infos',          label: 'Informations' },
  { id: 'medical',        label: 'Médical' },
  { id: 'ordonnances',    label: 'Ordonnances' },
  { id: 'soins',          label: 'Soins' },
  { id: 'transmissions',  label: 'Transmissions' },
  { id: 'documents',      label: 'Documents' },
  { id: 'historique',     label: 'Historique' },
  { id: 'urgence',        label: 'Fiche urgence' },
]

// ─── Sous-composants ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4 border-b border-gray-50 last:border-0 dark:border-gray-800">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {title}
        </h3>
        {children}
      </CardBody>
    </Card>
  )
}

// ─── Onglet Informations ──────────────────────────────────────────────────────

function TabInfos({ patient }: { patient: Patient }) {
  const fmtDate = (d?: string | null) => {
    if (!d) return undefined
    try { return format(new Date(d), 'd MMMM yyyy', { locale: fr }) } catch { return d }
  }
  const genderLabel = (g: Patient['gender']) =>
    g === 'M' ? 'Homme' : g === 'F' ? 'Femme' : g === 'autre' ? 'Autre' : undefined

  return (
    <div className="space-y-4">
      <SectionCard title="Identité">
        <dl>
          <InfoRow label="Nom complet"       value={`${patient.first_name} ${patient.last_name}`} />
          <InfoRow label="Date de naissance" value={fmtDate(patient.birth_date)} />
          <InfoRow label="Genre"             value={genderLabel(patient.gender)} />
          <InfoRow label="N° Sécurité sociale" value={patient.nir} />
        </dl>
      </SectionCard>
      <SectionCard title="Contact">
        <dl>
          <InfoRow label="Téléphone"          value={patient.phone} />
          <InfoRow label="Contact d'urgence"  value={patient.emergency_contact_name} />
          <InfoRow label="Tél. urgence"       value={patient.phone_emergency} />
          <InfoRow label="Adresse"            value={[patient.address, patient.postal_code, patient.city].filter(Boolean).join(', ')} />
        </dl>
      </SectionCard>
      {patient.notes && (
        <SectionCard title="Notes">
          <p className="text-sm text-gray-700 whitespace-pre-line dark:text-gray-300">{patient.notes}</p>
        </SectionCard>
      )}
    </div>
  )
}

// ─── Onglet Médical ───────────────────────────────────────────────────────────

function TabMedical({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Prise en charge">
        <dl>
          <InfoRow label="Médecin traitant"     value={patient.medecin_traitant} />
          <InfoRow label="Médecin prescripteur"  value={patient.medecin_prescripteur} />
          <InfoRow label="Mutuelle"              value={patient.mutuelle} />
          <InfoRow label="N° mutuelle"           value={patient.mutuelle_num} />
        </dl>
      </SectionCard>
      {(patient.pathologies?.length ?? 0) > 0 && (
        <SectionCard title="Pathologies">
          <div className="flex flex-wrap gap-1.5">
            {patient.pathologies!.map((p) => <Badge key={p} variant="warning">{p}</Badge>)}
          </div>
        </SectionCard>
      )}
      {(patient.allergies?.length ?? 0) > 0 && (
        <SectionCard title="Allergies">
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies!.map((a) => <Badge key={a} variant="error">{a}</Badge>)}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── Onglet Fiche urgence ─────────────────────────────────────────────────────

function TabUrgence({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          Fiche à destination des secours — données clés du patient
        </p>
      </div>
      <SectionCard title="Identité">
        <dl>
          <InfoRow label="Nom"                 value={`${patient.first_name} ${patient.last_name}`} />
          <InfoRow label="N° Sécurité sociale" value={patient.nir} />
          <InfoRow label="Pathologies"         value={patient.pathologies?.join(', ')} />
          <InfoRow label="Allergies"           value={patient.allergies?.join(', ')} />
        </dl>
      </SectionCard>
      <SectionCard title="Contacts d'urgence">
        <dl>
          <InfoRow label="Contact principal"   value={patient.emergency_contact_name} />
          <InfoRow label="Téléphone"           value={patient.phone_emergency ?? patient.phone} />
          <InfoRow label="Médecin traitant"    value={patient.medecin_traitant} />
          <InfoRow label="Mutuelle"            value={[patient.mutuelle, patient.mutuelle_num].filter(Boolean).join(' — ')} />
        </dl>
      </SectionCard>
    </div>
  )
}

// ─── Empty state réutilisable pour onglets en cours ──────────────────────────

function ComingSoon({ title, description, actionLabel, onAction }: {
  title: string; description: string; actionLabel: string; onAction: () => void
}) {
  return (
    <EmptyState title={title} description={description} action={{ label: actionLabel, onClick: onAction }} />
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Start immediately with demo data — never blank. Supabase updates in background.
  const [patient,   setPatient]   = useState<Patient>(DEMO_PATIENT)
  const [_loading,  setLoading]   = useState(false)
  const [demoMode,  setDemoMode]  = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('infos')

  useEffect(() => {
    if (!id) return
    console.log('[PatientDetailPage] fetching id:', id)

    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single()

        console.log('[PatientDetailPage] result:', { data, error })
        if (cancelled) return

        if (data && !error) {
          setPatient(data as Patient)
          setDemoMode(false)
        }
        // else: keep DEMO_PATIENT already set
      } catch (err) {
        console.warn('[PatientDetailPage] fetch error:', err)
        // keep DEMO_PATIENT
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [id])

  const fullName = `${patient.first_name} ${patient.last_name}`
  const age = patient.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-0">
      {/* Bannière mode démo */}
      {demoMode && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Patient non trouvé en base — affichage en mode démo.
        </div>
      )}

      {/* En-tête */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white dark:bg-navy-600">
              {`${patient.first_name[0] ?? ''}${patient.last_name[0] ?? ''}`.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900 dark:text-white">{fullName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {age !== null ? `${age} ans` : ''}
                {age !== null && patient.birth_date ? ` · Né(e) le ${format(new Date(patient.birth_date), 'd/MM/yyyy')}` : ''}
                {patient.city ? ` · ${patient.city}` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={patient.active ? 'success' : 'gray'}>
            {patient.active ? 'Actif' : 'Archivé'}
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/patients/${patient.id}/edit`)}>
            Modifier
          </Button>
          <Button size="sm" onClick={() => navigate('/planning')}>
            Planifier visite
          </Button>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto pb-px" aria-label="Onglets patient">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-navy-600 text-navy-700 dark:border-navy-400 dark:text-navy-300'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu */}
      <div className="pt-6">
        {activeTab === 'infos' && <TabInfos patient={patient} />}

        {activeTab === 'medical' && <TabMedical patient={patient} />}

        {activeTab === 'ordonnances' && (
          <ComingSoon
            title="Aucune ordonnance"
            description="Les ordonnances de ce patient apparaîtront ici."
            actionLabel="Ajouter une ordonnance"
            onAction={() => navigate('/fiches')}
          />
        )}

        {activeTab === 'soins' && (
          <ComingSoon
            title="Aucune note de soins"
            description="Les notes de soins de ce patient apparaîtront ici."
            actionLabel="Nouvelle note de soins"
            onAction={() => navigate('/soins')}
          />
        )}

        {activeTab === 'transmissions' && (
          <ComingSoon
            title="Aucune transmission"
            description="Les transmissions concernant ce patient apparaîtront ici."
            actionLabel="Nouvelle transmission"
            onAction={() => navigate('/transmissions')}
          />
        )}

        {activeTab === 'documents' && (
          <ComingSoon
            title="Aucun document"
            description="Les documents (résultats d'analyses, comptes-rendus) seront disponibles ici."
            actionLabel="Ajouter un document"
            onAction={() => {}}
          />
        )}

        {activeTab === 'historique' && (
          <ComingSoon
            title="Historique vide"
            description="L'historique des visites et modifications de la fiche patient apparaîtra ici."
            actionLabel="Voir le planning"
            onAction={() => navigate('/planning')}
          />
        )}

        {activeTab === 'urgence' && <TabUrgence patient={patient} />}
      </div>
    </div>
  )
}
