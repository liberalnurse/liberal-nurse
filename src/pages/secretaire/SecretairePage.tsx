// Espace secrétaire — tâches administratives
import { useState } from 'react'
import { clsx } from 'clsx'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface Task {
  id: string
  title: string
  priority: 'high' | 'normal' | 'low'
  done: boolean
  due?: string
  patient?: string
}

const mockTasks: Task[] = [
  { id: '1', title: 'Renouveler ordonnance Henri Leblanc',      priority: 'high',   done: false, due: '2024-01-20', patient: 'Henri Leblanc' },
  { id: '2', title: 'Envoyer courrier mutuelle Dupont',          priority: 'normal', done: false, due: '2024-01-22' },
  { id: '3', title: 'Planifier visite Paulette Renard après hospit.', priority: 'high', done: false, due: '2024-01-21', patient: 'Paulette Renard' },
  { id: '4', title: 'Archiver ordonnances janvier',              priority: 'low',    done: true },
  { id: '5', title: 'Mettre à jour fichier patients nouvelle adresse', priority: 'normal', done: false },
]

const mockAppointments = [
  { id: '1', patient: 'Marie Dupont',    time: '08:00', acte: 'AMI 2', nurse: 'Sophie L.' },
  { id: '2', patient: 'Jean Martin',     time: '09:30', acte: 'AIS 1', nurse: 'Sophie L.' },
  { id: '3', patient: 'Paulette Renard', time: '10:15', acte: 'AMI 3', nurse: 'Marie D.' },
  { id: '4', patient: 'Henri Leblanc',   time: '14:00', acte: 'AMI 1', nurse: 'Sophie L.' },
]

const priorityConfig = {
  high:   { label: 'Urgent',  cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  normal: { label: 'Normal',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  low:    { label: 'Basse',   cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
}

export default function SecretairePage() {
  const [tasks, setTasks] = useState(mockTasks)
  const [showModal, setShowModal] = useState(false)

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t))
  }

  const pending = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Espace secrétaire"
        subtitle={`${pending.length} tâche${pending.length > 1 ? 's' : ''} en cours`}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle tâche
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tâches */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Tâches administratives</h2>
            <span className="text-sm text-gray-400">{pending.length} en cours</span>
          </CardHeader>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[...pending, ...done].map((task) => {
              const pc = priorityConfig[task.priority]
              return (
                <div key={task.id} className={clsx('flex items-start gap-3 px-5 py-3', task.done && 'opacity-60')}>
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={clsx(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                      task.done
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 hover:border-navy-500 dark:border-gray-600'
                    )}
                  >
                    {task.done && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm text-gray-900 dark:text-white', task.done && 'line-through')}>{task.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {task.patient && <span className="text-gray-400">{task.patient}</span>}
                      {task.due && <span className="text-gray-400">Avant le {new Intl.DateTimeFormat('fr-FR').format(new Date(task.due))}</span>}
                    </div>
                  </div>
                  <span className={clsx('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', pc.cls)}>{pc.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Planning du jour */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Planning du jour</h2>
          </CardHeader>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {mockAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-12 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">{apt.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{apt.patient}</p>
                  <p className="text-xs text-gray-400">{apt.acte} · {apt.nurse}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouvelle tâche">
        <div className="space-y-4">
          <Input label="Titre de la tâche" placeholder="Décrivez la tâche..." />
          <Input label="Patient concerné (optionnel)" placeholder="Nom du patient" />
          <Input label="Date limite" type="date" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={() => setShowModal(false)}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
