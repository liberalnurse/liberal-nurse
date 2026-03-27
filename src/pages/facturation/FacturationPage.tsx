// Facturation — suivi des honoraires et abonnement
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'

interface FactureItem {
  id: string
  date: string
  description: string
  montant: number
  statut: 'paid' | 'pending' | 'failed'
}

const mockFactures: FactureItem[] = [
  { id: 'INV-2024-006', date: '2024-01-01', description: 'Abonnement Pro — Janvier 2024',    montant: 49,  statut: 'paid' },
  { id: 'INV-2023-012', date: '2023-12-01', description: 'Abonnement Pro — Décembre 2023',   montant: 49,  statut: 'paid' },
  { id: 'INV-2023-011', date: '2023-11-01', description: 'Abonnement Pro — Novembre 2023',   montant: 49,  statut: 'paid' },
  { id: 'INV-2023-010', date: '2023-10-01', description: 'Abonnement Pro — Octobre 2023',    montant: 49,  statut: 'paid' },
  { id: 'INV-2023-009', date: '2023-09-01', description: 'Abonnement Starter — Sep. 2023',   montant: 29,  statut: 'paid' },
]

const statutConfig: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Payé',     cls: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  pending: { label: 'En cours', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  failed:  { label: 'Échec',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const columns: Column<FactureItem>[] = [
  { key: 'id', label: 'Référence', render: (row) => <span className="font-mono text-sm">{row.id}</span> },
  { key: 'date', label: 'Date', render: (row) => new Intl.DateTimeFormat('fr-FR').format(new Date(row.date)) },
  { key: 'description', label: 'Description' },
  { key: 'montant', label: 'Montant', align: 'right', render: (row) => <span className="font-medium">{fmt(row.montant)}</span> },
  {
    key: 'statut', label: 'Statut', align: 'center',
    render: (row) => {
      const sc = statutConfig[row.statut]
      return <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', sc.cls)}>{sc.label}</span>
    },
  },
  {
    key: 'id', label: '', align: 'right',
    render: () => (
      <button className="text-xs text-navy-600 hover:underline dark:text-navy-400">
        Télécharger PDF
      </button>
    ),
  },
]

export default function FacturationPage() {
  const [tab, setTab] = useState<'abonnement' | 'factures'>('abonnement')

  const plans = [
    { name: 'Starter', price: 29, features: ['1 infirmière', 'Patients illimités', 'Planning', 'Transmissions', 'Stock'], current: false },
    { name: 'Pro', price: 49, features: ['Jusqu\'à 5 infirmières', 'Tout Starter +', 'Remplacements & rétrocessions', 'Statistiques avancées', 'SMS & messagerie', 'Export comptable'], current: true },
    { name: 'Enterprise', price: 99, features: ['Infirmières illimitées', 'Tout Pro +', 'Multi-cabinets', 'API', 'Support dédié', 'Formation incluse'], current: false },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Facturation" subtitle="Gérez votre abonnement et vos factures" />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800 w-fit">
        {(['abonnement', 'factures'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'bg-white shadow text-gray-900 dark:bg-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {t === 'abonnement' ? 'Mon abonnement' : 'Historique factures'}
          </button>
        ))}
      </div>

      {tab === 'abonnement' ? (
        <div className="space-y-6">
          {/* Plan actuel */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-900 dark:text-white">Plan actuel</h2>
              <span className="rounded-full bg-navy-100 px-3 py-1 text-sm font-semibold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                Pro — 49 €/mois
              </span>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prochain prélèvement : <strong className="text-gray-900 dark:text-white">1er février 2024</strong></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Carte bancaire : •••• •••• •••• 4242</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm">Modifier la carte</Button>
                  <Button variant="secondary" size="sm">Annuler l'abonnement</Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Plans disponibles */}
          <div>
            <h2 className="mb-4 font-semibold text-navy-900 dark:text-white">Changer de plan</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.name} className={clsx(plan.current && 'ring-2 ring-navy-500 dark:ring-navy-400')}>
                  <CardBody className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                        {plan.current && (
                          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                            Actuel
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-navy-900 dark:text-white">
                        {plan.price} €<span className="text-base font-normal text-gray-400">/mois</span>
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!plan.current && (
                      <Button variant={plan.price > 49 ? 'primary' : 'secondary'} className="w-full">
                        {plan.price > 49 ? 'Passer à Enterprise' : 'Rétrograder'}
                      </Button>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Table<FactureItem> columns={columns} data={mockFactures} />
        </div>
      )}
    </div>
  )
}
