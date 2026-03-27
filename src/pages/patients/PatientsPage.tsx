// Liste des patients avec recherche, filtres, tableau et vue split desktop
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { usePatients } from '@/hooks/usePatients'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, type Column } from '@/components/ui/Table'
import type { Patient } from '@/types'

// ─── Données mockées ──────────────────────────────────────────────────────────

const mockPatients: Patient[] = [
  { id: '1', cabinet_id: 'c1', last_name: 'Dupont',  first_name: 'Marie',    birth_date: '1948-03-15', phone: '06 12 34 56 78', address: '12 rue des Lilas', city: 'Lyon',        postal_code: '69001', active: true,  medecin_traitant: 'Dr. Martin', mutuelle: 'MGEN',     nir: '2480375011234', created_at: '', updated_at: '' },
  { id: '2', cabinet_id: 'c1', last_name: 'Martin',  first_name: 'Jean',     birth_date: '1952-07-22', phone: '06 23 45 67 89', address: '5 av. Foch',       city: 'Lyon',        postal_code: '69002', active: true,  medecin_traitant: 'Dr. Dupuis', mutuelle: 'Harmonie', nir: '1520769011234', created_at: '', updated_at: '' },
  { id: '3', cabinet_id: 'c1', last_name: 'Renard',  first_name: 'Paulette', birth_date: '1963-11-08', phone: '07 34 56 78 90', address: '28 bd Voltaire',   city: 'Villeurbanne',postal_code: '69100', active: true,  medecin_traitant: 'Dr. Bernard',mutuelle: 'MAAF',     nir: '2631169100123', created_at: '', updated_at: '' },
  { id: '4', cabinet_id: 'c1', last_name: 'Leblanc', first_name: 'Henri',    birth_date: '1939-05-30', phone: '06 45 67 89 01', address: '3 rue Pasteur',    city: 'Bron',        postal_code: '69500', active: true,  medecin_traitant: 'Dr. Petit',  mutuelle: 'MNH',      nir: '1390569500234', created_at: '', updated_at: '' },
  { id: '5', cabinet_id: 'c1', last_name: 'Simon',   first_name: 'Colette',  birth_date: '1958-09-12', phone: '07 56 78 90 12', address: '17 cours Vitton',  city: 'Lyon',        postal_code: '69003', active: false, medecin_traitant: 'Dr. Martin', mutuelle: 'MGEN',     nir: '2580969003345', created_at: '', updated_at: '' },
  { id: '6', cabinet_id: 'c1', last_name: 'Bernard', first_name: 'Pierre',   birth_date: '1971-02-28', phone: '06 67 89 01 23', address: '9 rue Garibaldi',  city: 'Lyon',        postal_code: '69007', active: true,  medecin_traitant: 'Dr. Blanc',  mutuelle: 'AXA',      nir: '1710269007456', created_at: '', updated_at: '' },
]

// ─── Colonnes tableau ─────────────────────────────────────────────────────────

const columns: Column<Patient>[] = [
  {
    key: 'last_name',
    label: 'Patient',
    sortable: true,
    render: (row) => (
      <span className="font-medium text-navy-900 dark:text-white">
        {row.last_name} {row.first_name}
      </span>
    ),
  },
  {
    key: 'birth_date',
    label: 'Naissance',
    sortable: true,
    render: (row) =>
      row.birth_date
        ? new Intl.DateTimeFormat('fr-FR').format(new Date(row.birth_date))
        : '—',
  },
  { key: 'phone', label: 'Téléphone' },
  {
    key: 'city',
    label: 'Ville',
    render: (row) => row.city ?? row.postal_code ?? '—',
  },
  {
    key: 'active',
    label: 'Statut',
    align: 'center',
    render: (row) => (
      <span className={clsx(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        row.active
          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
      )}>
        {row.active ? 'Actif' : 'Archivé'}
      </span>
    ),
  },
]

// ─── Panneau de détail (desktop) ──────────────────────────────────────────────

function PatientDetailPanel({ patient, onClose, onNavigate }: {
  patient: Patient
  onClose: () => void
  onNavigate: () => void
}) {
  const formatDate = (d?: string | null) => {
    if (!d) return '—'
    try { return format(new Date(d), 'd MMMM yyyy', { locale: fr }) } catch { return d }
  }

  const initials = `${patient.first_name[0] ?? ''}${patient.last_name[0] ?? ''}`.toUpperCase()
  const age = patient.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* En-tête */}
      <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white dark:bg-navy-600">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-navy-900 dark:text-white">
              {patient.first_name} {patient.last_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {age !== null ? `${age} ans` : ''}
              {age !== null && patient.city ? ' · ' : ''}
              {patient.city ?? ''}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Statut */}
        <div className="flex items-center gap-2">
          <Badge variant={patient.active ? 'success' : 'gray'}>
            {patient.active ? 'Actif' : 'Archivé'}
          </Badge>
          {patient.mutuelle && (
            <Badge variant="primary">{patient.mutuelle}</Badge>
          )}
        </div>

        {/* Infos clés */}
        <Card>
          <CardBody className="space-y-2.5">
            <InfoLine icon="calendar" label="Naissance" value={formatDate(patient.birth_date)} />
            <InfoLine icon="phone" label="Téléphone" value={patient.phone ?? '—'} />
            <InfoLine icon="map-pin" label="Adresse" value={[patient.address, patient.postal_code, patient.city].filter(Boolean).join(', ') || '—'} />
            <InfoLine icon="user" label="Médecin traitant" value={patient.medecin_traitant ?? '—'} />
            <InfoLine icon="id-card" label="N° sécu" value={patient.nir ?? '—'} />
          </CardBody>
        </Card>

        {/* Pathologies / allergies */}
        {((patient.pathologies?.length ?? 0) > 0 || (patient.allergies?.length ?? 0) > 0) && (
          <Card>
            <CardBody className="space-y-2">
              {(patient.pathologies?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Pathologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.pathologies!.map((p) => <Badge key={p} variant="warning">{p}</Badge>)}
                  </div>
                </div>
              )}
              {(patient.allergies?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Allergies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies!.map((a) => <Badge key={a} variant="error">{a}</Badge>)}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {patient.notes && (
          <Card>
            <CardBody>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-line dark:text-gray-300">{patient.notes}</p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <Button size="sm" variant="secondary" className="flex-1" onClick={onNavigate}>
          Fiche complète
        </Button>
        <Button size="sm" className="flex-1" onClick={() => {}}>
          Planifier visite
        </Button>
      </div>
    </div>
  )
}

function InfoLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0">{iconFor(icon)}</span>
      <span className="w-28 flex-shrink-0 text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  )
}

function iconFor(name: string) {
  const cls = 'h-4 w-4'
  if (name === 'calendar') return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
  if (name === 'phone') return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
  if (name === 'map-pin') return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
  if (name === 'user') return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
  if (name === 'id-card') return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>
  return null
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PatientsPage() {
  const navigate = useNavigate()
  const { patients, loading, fetchPatients } = usePatients()
  const [search, setSearch]         = useState('')
  const [filterActif, setFilterActif] = useState<'all' | 'actif' | 'archive'>('all')
  const [page, setPage]             = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isMobile, setIsMobile]     = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const displayPatients = patients.length > 0 ? patients : mockPatients

  const filtered = displayPatients.filter((p) => {
    const matchSearch =
      search === '' ||
      `${p.last_name} ${p.first_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone ?? '').includes(search)
    const matchActif =
      filterActif === 'all' ||
      (filterActif === 'actif' && p.active) ||
      (filterActif === 'archive' && !p.active)
    return matchSearch && matchActif
  })

  useEffect(() => {
    fetchPatients({ search, active: filterActif === 'all' ? undefined : filterActif === 'actif' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleRowClick = (row: Patient) => {
    if (isMobile) {
      navigate(`/patients/${row.id}`)
    } else {
      setSelectedId(row.id)
    }
  }

  const selectedPatient = selectedId
    ? displayPatients.find((p) => p.id === selectedId) ?? null
    : null

  const handleExportCsv = () => {
    const headers = ['Nom', 'Prénom', 'Date naissance', 'Téléphone', 'Ville', 'Statut']
    const rows = filtered.map((p) => [p.last_name, p.first_name, p.birth_date ?? '', p.phone ?? '', p.city ?? '', p.active ? 'Actif' : 'Archivé'])
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'patients.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const PAGE_SIZE = 10
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className={clsx('flex h-full gap-4', selectedId ? 'lg:items-start' : '')}>
      {/* ── Colonne liste ── */}
      <div className={clsx('flex flex-col gap-4', selectedId ? 'hidden lg:flex lg:w-[42%] lg:flex-shrink-0' : 'w-full')}>
        <PageHeader
          title="Patients"
          subtitle={`${filtered.length} patient${filtered.length > 1 ? 's' : ''}`}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={handleExportCsv}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                CSV
              </Button>
              <Button onClick={() => navigate('/patients/nouveau')}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nouveau
              </Button>
            </>
          }
        />

        {/* Recherche + filtres */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Nom, prénom, téléphone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              }
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'actif', 'archive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilterActif(f); setPage(1) }}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700',
                  filterActif === f
                    ? 'bg-navy-800 text-white dark:bg-navy-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                )}
              >
                {f === 'all' ? 'Tous' : f === 'actif' ? 'Actifs' : 'Archivés'}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        {filtered.length === 0 && !loading ? (
          <EmptyState
            title="Aucun patient trouvé"
            description="Modifiez vos critères ou ajoutez un nouveau patient."
            action={{ label: 'Nouveau patient', onClick: () => navigate('/patients/nouveau') }}
          />
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Table<Patient>
              columns={selectedId ? columns.slice(0, 2) : columns}
              data={paginated}
              loading={loading}
              onRowClick={handleRowClick}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Précédent
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Colonne détail (desktop uniquement) ── */}
      {selectedPatient && (
        <div className="hidden lg:flex lg:flex-1 lg:flex-col" style={{ minHeight: 0 }}>
          <PatientDetailPanel
            patient={selectedPatient}
            onClose={() => setSelectedId(null)}
            onNavigate={() => navigate(`/patients/${selectedPatient.id}`)}
          />
        </div>
      )}

      {/* Placeholder quand aucun patient sélectionné sur desktop */}
      {!selectedId && (
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
          <div className="text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">Sélectionnez un patient<br />pour voir sa fiche</p>
          </div>
        </div>
      )}
    </div>
  )
}
