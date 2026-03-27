// Rétrocessions financières
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Table, type Column } from '@/components/ui/Table'
import { Card, CardBody } from '@/components/ui/Card'
import type { Retrocession } from '@/types'

const mockRetrocessions: Retrocession[] = [
  { id: '1', cabinet_id: 'c1', remplacante_id: 'r1', periode_debut: '2024-02-01', periode_fin: '2024-02-15', montant_brut: 7800, montant_net: 5460, taux: 70, statut: 'paid', reference_virement: 'VIR-2024-001', paid_at: '2024-02-20T10:00:00Z', created_at: '' },
  { id: '2', cabinet_id: 'c1', remplacante_id: 'r2', periode_debut: '2024-03-10', periode_fin: '2024-03-17', montant_brut: 3200, montant_net: 2080, taux: 65, statut: 'pending', created_at: '' },
  { id: '3', cabinet_id: 'c1', remplacante_id: 'r3', periode_debut: '2024-01-05', periode_fin: '2024-01-19', montant_brut: 9100, montant_net: 6188, taux: 68, statut: 'paid', reference_virement: 'VIR-2024-002', paid_at: '2024-01-25T14:00:00Z', created_at: '' },
]

const remplacantes: Record<string, string> = {
  r1: 'Julie Morin',
  r2: 'Emma Petit',
  r3: 'Clara Bernard',
}

const statutConfig: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'En attente', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  paid:      { label: 'Payé',       cls: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  cancelled: { label: 'Annulé',     cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const columns: Column<Retrocession>[] = [
  {
    key: 'remplacante_id',
    label: 'Remplaçante',
    render: (row) => <span className="font-medium text-gray-900 dark:text-white">{remplacantes[row.remplacante_id] ?? row.remplacante_id}</span>,
  },
  {
    key: 'periode_debut',
    label: 'Période',
    render: (row) => `${new Intl.DateTimeFormat('fr-FR').format(new Date(row.periode_debut))} → ${new Intl.DateTimeFormat('fr-FR').format(new Date(row.periode_fin))}`,
  },
  { key: 'taux', label: 'Taux', align: 'center', render: (row) => `${row.taux} %` },
  { key: 'montant_brut', label: 'Brut', align: 'right', render: (row) => fmt(row.montant_brut) },
  { key: 'montant_net', label: 'Net remplaçante', align: 'right', render: (row) => <span className="font-semibold">{fmt(row.montant_net)}</span> },
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

export default function RetrocessionsPage() {
  const [retrocessions] = useState(mockRetrocessions)

  const totalBrut = retrocessions.reduce((s, r) => s + r.montant_brut, 0)
  const totalNet  = retrocessions.reduce((s, r) => s + r.montant_net, 0)
  const pending   = retrocessions.filter((r) => r.statut === 'pending')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Rétrocessions"
        subtitle="Suivi des paiements aux remplaçantes"
        actions={
          pending.length > 0 ? (
            <Button>
              Valider {pending.length} paiement{pending.length > 1 ? 's' : ''}
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total honoraires', value: fmt(totalBrut), sub: 'sur toutes les périodes' },
          { label: 'Total rétrocédé', value: fmt(totalNet), sub: 'versé aux remplaçantes' },
          { label: 'En attente', value: fmt(pending.reduce((s, r) => s + r.montant_net, 0)), sub: `${pending.length} virement${pending.length > 1 ? 's' : ''} à effectuer` },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardBody>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Table<Retrocession> columns={columns} data={retrocessions} />
      </div>
    </div>
  )
}
