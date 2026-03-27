// Contrats de remplacement
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, type Column } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Contrat } from '@/types'

const mockContrats: Contrat[] = [
  { id: '1', cabinet_id: 'c1', titulaire_id: 'u1', remplacante_name: 'Julie Morin',    remplacante_rpps: '10012345', date_debut: '2024-02-01', date_fin: '2024-02-15', retrocession: 70, honoraires_prevus: 8000, honoraires_realises: 7800, motif: 'Congé maternité', statut: 'signed', created_at: '', updated_at: '' },
  { id: '2', cabinet_id: 'c1', titulaire_id: 'u1', remplacante_name: 'Emma Petit',     remplacante_rpps: '10023456', date_debut: '2024-03-10', date_fin: '2024-03-17', retrocession: 65, honoraires_prevus: 3500, motif: 'Congé maladie', statut: 'active', created_at: '', updated_at: '' },
  { id: '3', cabinet_id: 'c1', titulaire_id: 'u1', remplacante_name: 'Clara Bernard',  date_debut: '2024-04-01', date_fin: '2024-04-30', retrocession: 68, motif: 'Vacances', statut: 'draft', created_at: '', updated_at: '' },
]

const statutConfig: Record<string, { label: string; cls: string }> = {
  draft:      { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  signed:     { label: 'Signé',     cls: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  active:     { label: 'En cours',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  terminated: { label: 'Terminé',   cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
}

const columns: Column<Contrat>[] = [
  {
    key: 'remplacante_name',
    label: 'Remplaçante',
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{row.remplacante_name ?? '—'}</p>
        {row.remplacante_rpps && <p className="text-xs text-gray-400">RPPS {row.remplacante_rpps}</p>}
      </div>
    ),
  },
  {
    key: 'date_debut',
    label: 'Période',
    render: (row) => (
      <span>
        {new Intl.DateTimeFormat('fr-FR').format(new Date(row.date_debut))}
        {' → '}
        {new Intl.DateTimeFormat('fr-FR').format(new Date(row.date_fin))}
      </span>
    ),
  },
  {
    key: 'retrocession',
    label: 'Rétrocession',
    align: 'center',
    render: (row) => <span className="font-medium">{row.retrocession} %</span>,
  },
  {
    key: 'honoraires_prevus',
    label: 'Honoraires prévus',
    align: 'right',
    render: (row) => row.honoraires_prevus != null
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(row.honoraires_prevus)
      : '—',
  },
  {
    key: 'statut',
    label: 'Statut',
    align: 'center',
    render: (row) => {
      const sc = statutConfig[row.statut]
      return <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', sc.cls)}>{sc.label}</span>
    },
  },
]

export default function ContratsPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = mockContrats.filter((c) =>
    !search || (c.remplacante_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contrats de remplacement"
        subtitle={`${mockContrats.length} contrat${mockContrats.length > 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouveau contrat
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder="Rechercher par remplaçante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          }
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun contrat"
          description="Créez votre premier contrat de remplacement."
          action={{ label: 'Nouveau contrat', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Table<Contrat> columns={columns} data={filtered} />
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau contrat de remplacement">
        <div className="space-y-4">
          <Input label="Nom de la remplaçante" placeholder="Prénom Nom" />
          <Input label="RPPS de la remplaçante" placeholder="10 chiffres" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de début" type="date" />
            <Input label="Date de fin" type="date" />
          </div>
          <Input label="Taux de rétrocession (%)" type="number" placeholder="70" />
          <Input label="Honoraires prévus (€)" type="number" placeholder="5000" />
          <Input label="Motif" placeholder="Congé, maladie, formation..." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={() => setShowModal(false)}>Créer le contrat</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
