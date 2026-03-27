// Gestion du stock de matériel médical
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table, type Column } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import type { StockItem } from '@/types'

const mockStock: StockItem[] = [
  { id: '1', cabinet_id: 'c1', name: 'Seringues 5mL',         reference: 'SER-5',  category: 'Injection',    quantity: 3,  unit: 'boîtes',  alert_threshold: 10, supplier: 'Medline',   unit_price: 4.50,  created_at: '', updated_at: '' },
  { id: '2', cabinet_id: 'c1', name: 'Compresses stériles',   reference: 'CMP-10', category: 'Pansement',   quantity: 8,  unit: 'sachets', alert_threshold: 20, supplier: 'Hartmann',  unit_price: 0.80,  created_at: '', updated_at: '' },
  { id: '3', cabinet_id: 'c1', name: 'Gants latex M',         reference: 'GLT-M',  category: 'Protection',  quantity: 12, unit: 'paires',  alert_threshold: 50, supplier: 'Ansell',    unit_price: 0.15,  created_at: '', updated_at: '' },
  { id: '4', cabinet_id: 'c1', name: 'Aiguilles IM 25G',      reference: 'AIL-25', category: 'Injection',    quantity: 45, unit: 'pièces',  alert_threshold: 30, supplier: 'BD',        unit_price: 0.12,  created_at: '', updated_at: '' },
  { id: '5', cabinet_id: 'c1', name: 'Sparadrap hypoallerg.', reference: 'SPR-H',  category: 'Pansement',   quantity: 22, unit: 'rouleaux',alert_threshold: 10, supplier: 'Medline',   unit_price: 2.30,  created_at: '', updated_at: '' },
  { id: '6', cabinet_id: 'c1', name: 'Mépilex Border Lite',   reference: 'MPX-BL', category: 'Pansement',   quantity: 6,  unit: 'boîtes',  alert_threshold: 5,  supplier: 'Mölnlycke', unit_price: 18.90, created_at: '', updated_at: '' },
  { id: '7', cabinet_id: 'c1', name: 'Désinfectant Biseptine',reference: 'BIS-500',category: 'Antiseptique', quantity: 4,  unit: 'flacons', alert_threshold: 3,  supplier: 'Cooper',    unit_price: 6.40,  created_at: '', updated_at: '' },
]

const categories = ['Tous', 'Injection', 'Pansement', 'Protection', 'Antiseptique']

const columns: Column<StockItem>[] = [
  {
    key: 'name',
    label: 'Article',
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
        {row.reference && <p className="text-xs text-gray-400">{row.reference}</p>}
      </div>
    ),
  },
  { key: 'category', label: 'Catégorie', render: (row) => row.category ?? '—' },
  {
    key: 'quantity',
    label: 'Quantité',
    align: 'center',
    render: (row) => {
      const low = row.quantity <= row.alert_threshold
      return (
        <span className={clsx('font-semibold', low ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white')}>
          {row.quantity} {row.unit}
        </span>
      )
    },
  },
  {
    key: 'alert_threshold',
    label: 'Seuil alerte',
    align: 'center',
    render: (row) => <span className="text-gray-400">{row.alert_threshold} {row.unit}</span>,
  },
  {
    key: 'quantity',
    label: 'Niveau',
    align: 'center',
    render: (row) => {
      const pct = Math.min(Math.round((row.quantity / row.alert_threshold) * 100), 100)
      const color = pct <= 30 ? 'bg-red-500' : pct <= 60 ? 'bg-orange-400' : 'bg-green-500'
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className={clsx('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-400">{pct}%</span>
        </div>
      )
    },
  },
  {
    key: 'supplier',
    label: 'Fournisseur',
    render: (row) => row.supplier ?? '—',
  },
]

export default function StockPage() {
  const [stock] = useState(mockStock)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tous')
  const [showModal, setShowModal] = useState(false)
  const [showMovement, setShowMovement] = useState(false)

  const alertItems = stock.filter((s) => s.quantity <= s.alert_threshold)

  const filtered = stock.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.reference ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Tous' || s.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock"
        subtitle={`${stock.length} articles · ${alertItems.length} en alerte`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowMovement(true)}>
              Mouvement
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouvel article
            </Button>
          </>
        }
      />

      {alertItems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            ⚠️ {alertItems.length} article{alertItems.length > 1 ? 's' : ''} sous le seuil d'alerte :{' '}
            {alertItems.map((i) => i.name).join(', ')}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            }
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun article"
          description="Ajoutez votre premier article en stock."
          action={{ label: 'Nouvel article', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Table<StockItem> columns={columns} data={filtered} />
        </div>
      )}

      {/* Modal nouvel article */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvel article">
        <div className="space-y-4">
          <Input label="Nom de l'article" placeholder="ex: Seringues 5mL" />
          <Input label="Référence" placeholder="ex: SER-5" />
          <Select label="Catégorie" options={['Injection','Pansement','Protection','Antiseptique','Autre'].map((c) => ({ value: c, label: c }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantité initiale" type="number" placeholder="0" />
            <Input label="Unité" placeholder="boîtes, pièces..." />
          </div>
          <Input label="Seuil d'alerte" type="number" placeholder="10" />
          <Input label="Fournisseur" placeholder="Nom du fournisseur" />
          <Input label="Prix unitaire (€)" type="number" placeholder="0.00" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={() => setShowModal(false)}>Ajouter</Button>
          </div>
        </div>
      </Modal>

      {/* Modal mouvement */}
      <Modal open={showMovement} onClose={() => setShowMovement(false)} title="Enregistrer un mouvement">
        <div className="space-y-4">
          <Select label="Article" options={stock.map((s) => ({ value: s.id, label: s.name }))} />
          <Select label="Type de mouvement" options={[
            { value: 'in',         label: 'Entrée (réapprovisionnement)' },
            { value: 'out',        label: 'Sortie (utilisation)' },
            { value: 'waste',      label: 'Perte / Périmé' },
            { value: 'adjustment', label: 'Ajustement manuel' },
          ]} />
          <Input label="Quantité" type="number" placeholder="0" />
          <Input label="Note" placeholder="Commentaire optionnel..." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowMovement(false)}>Annuler</Button>
            <Button onClick={() => setShowMovement(false)}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
