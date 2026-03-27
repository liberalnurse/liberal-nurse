// Détail d'une note de soins
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { clsx } from 'clsx'

const mockNote = {
  id: '1',
  patient: 'Marie Dupont',
  patient_id: '1',
  date: '2024-01-15',
  time: '08:00',
  nurse: 'Sophie Lefèvre',
  acte: 'AMI 2 — Pansement complexe',
  content: 'Pansement refait sur plaie du pied gauche. Cicatrisation en bonne voie. La patiente se plaint de légères douleurs à la palpation. Application de Mepilex Border Lite. Prochaine évaluation dans 48h.\n\nPatiente consciente, orientée, coopérante. Pas de signe infectieux apparent.',
  constantes: {
    tension_sys: 138,
    tension_dia: 82,
    pouls: 74,
    temperature: 37.1,
    spo2: 98,
    glycemie: 1.12,
    poids: 62,
  },
  status: 'done',
  signed_at: '2024-01-15T08:45:00Z',
  photos: [],
}

export default function SoinDetailPage() {
  const { visitId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Note de soins"
        subtitle={`Visite #${visitId ?? mockNote.id} — ${mockNote.patient}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/soins')}>
              Retour
            </Button>
            <Button size="sm" onClick={() => {}}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
              </svg>
              Modifier
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Infos principales */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-900 dark:text-white">Compte-rendu de soin</h2>
              <span className={clsx(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
              )}>
                Signé
              </span>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Acte :</span>
                <span className="text-gray-900 dark:text-white">{mockNote.acte}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Date :</span>
                <span className="text-gray-900 dark:text-white">
                  {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(mockNote.date))} à {mockNote.time}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Infirmière :</span>
                <span className="text-gray-900 dark:text-white">{mockNote.nurse}</span>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{mockNote.content}</p>
              </div>
              {mockNote.signed_at && (
                <p className="text-xs text-gray-400">
                  Signé le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(mockNote.signed_at))}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Constantes */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-900 dark:text-white">Constantes</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { label: 'Tension', value: `${mockNote.constantes.tension_sys}/${mockNote.constantes.tension_dia} mmHg` },
                  { label: 'Pouls', value: `${mockNote.constantes.pouls} bpm` },
                  { label: 'Température', value: `${mockNote.constantes.temperature} °C` },
                  { label: 'SpO2', value: `${mockNote.constantes.spo2} %` },
                  { label: 'Glycémie', value: `${mockNote.constantes.glycemie} g/L` },
                  { label: 'Poids', value: `${mockNote.constantes.poids} kg` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-navy-900 dark:text-white">Patient</h2>
            </CardHeader>
            <CardBody>
              <button
                onClick={() => navigate(`/patients/${mockNote.patient_id}`)}
                className="flex w-full items-center gap-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700 dark:bg-navy-900 dark:text-navy-300">
                  {mockNote.patient.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{mockNote.patient}</p>
                  <p className="text-xs text-navy-600 hover:underline dark:text-navy-400">Voir le dossier →</p>
                </div>
              </button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
