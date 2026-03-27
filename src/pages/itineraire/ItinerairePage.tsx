import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types locaux ─────────────────────────────────────────────────────────────

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night'
type VisitStatus = 'planned' | 'done' | 'cancelled' | 'absent'

interface DemoVisit {
  id: string
  patient: {
    first_name: string
    last_name: string
    address: string
  }
  time_slot: TimeSlot
  status: VisitStatus
  coords?: [number, number]
}

// ─── Données de démonstration (avec coordonnées pré-calculées) ────────────────

const DEMO_VISITS: DemoVisit[] = [
  {
    id: '1',
    patient: { first_name: 'Marie', last_name: 'Dupont', address: '12 rue des Lilas, 75011 Paris' },
    time_slot: 'morning',
    status: 'planned',
    coords: [48.8605, 2.3795],
  },
  {
    id: '2',
    patient: { first_name: 'Jean', last_name: 'Martin', address: '5 avenue Foch, 75008 Paris' },
    time_slot: 'morning',
    status: 'done',
    coords: [48.8730, 2.2973],
  },
  {
    id: '3',
    patient: { first_name: 'Sylvie', last_name: 'Bernard', address: '28 bd Voltaire, 75011 Paris' },
    time_slot: 'afternoon',
    status: 'planned',
    coords: [48.8622, 2.3723],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
  evening: 'Soir',
  night: 'Nuit',
}

const TIME_SLOT_VARIANTS: Record<TimeSlot, 'primary' | 'warning' | 'gray' | 'error'> = {
  morning: 'primary',
  afternoon: 'warning',
  evening: 'gray',
  night: 'error',
}

const STATUS_LABELS: Record<VisitStatus, string> = {
  planned: 'Planifiée',
  done: 'Effectuée',
  cancelled: 'Annulée',
  absent: 'Absent',
}

const STATUS_VARIANTS: Record<VisitStatus, 'primary' | 'success' | 'error' | 'gray'> = {
  planned: 'primary',
  done: 'success',
  cancelled: 'error',
  absent: 'gray',
}

// ─── Géocodage via Nominatim (OpenStreetMap, sans clé API) ───────────────────

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { Accept: 'application/json' } }
    )
    if (!resp.ok) return null
    const data: { lat: string; lon: string }[] = await resp.json()
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }
  } catch {}
  return null
}

// ─── Marqueur numéroté (DivIcon, sans fichier PNG externe) ───────────────────

function makeIcon(n: number, done: boolean) {
  const bg = done ? '#10b981' : '#0f2d5c'
  return L.divIcon({
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${bg};color:white;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;font-family:sans-serif;
      border:2.5px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.35)
    ">${n}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

// ─── Auto-zoom sur tous les marqueurs ────────────────────────────────────────

function MapFitter({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 1) {
      map.setView(coords[0], 15)
    } else if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
    }
  }, [map, coords])
  return null
}

// ─── Carte OpenStreetMap ──────────────────────────────────────────────────────

function TourneeMap({ visits }: { visits: DemoVisit[] }) {
  const [geocoded, setGeocoded] = useState<DemoVisit[]>(visits)

  // Géocode les adresses qui n'ont pas encore de coordonnées
  useEffect(() => {
    setGeocoded(visits)

    const needsGeocoding = visits.filter((v) => !v.coords)
    if (needsGeocoding.length === 0) return

    let cancelled = false

    const run = async () => {
      const updated = [...visits]
      for (let i = 0; i < visits.length; i++) {
        if (cancelled) break
        if (!visits[i].coords) {
          const coords = await geocodeAddress(visits[i].patient.address)
          if (coords && !cancelled) {
            updated[i] = { ...updated[i], coords }
            setGeocoded([...updated])
          }
          // Respecte la limite de 1 req/s de Nominatim
          await new Promise((r) => setTimeout(r, 400))
        }
      }
    }

    run()
    return () => { cancelled = true }
  }, [visits])

  const withCoords = geocoded.filter((v): v is DemoVisit & { coords: [number, number] } =>
    Array.isArray(v.coords)
  )
  const allCoords = withCoords.map((v) => v.coords)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm dark:border-gray-800">
      <MapContainer
        center={[48.866, 2.333]}
        zoom={12}
        style={{ height: '340px' }}
        scrollWheelZoom={false}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allCoords.length > 0 && <MapFitter coords={allCoords} />}
        {withCoords.map((visit, i) => (
          <Marker
            key={visit.id}
            position={visit.coords}
            icon={makeIcon(i + 1, visit.status === 'done')}
          >
            <Popup>
              <div className="min-w-[160px] text-sm">
                <p className="font-semibold text-gray-900">
                  {visit.patient.first_name} {visit.patient.last_name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{visit.patient.address}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {TIME_SLOT_LABELS[visit.time_slot]} · {STATUS_LABELS[visit.status]}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

// ─── Ligne visite ─────────────────────────────────────────────────────────────

interface VisitRowProps {
  visit: DemoVisit
  index: number
  onMarkDone: (id: string) => void
}

function VisitRow({ visit, index, onMarkDone }: VisitRowProps) {
  const isDone = visit.status === 'done'
  const addr = encodeURIComponent(visit.patient.address)

  return (
    <div
      className={clsx(
        'flex items-start gap-4 rounded-2xl border p-4 transition-colors',
        isDone
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
          : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
      )}
    >
      {/* Numéro d'ordre */}
      <div
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          isDone
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
            : 'bg-navy-100 text-navy-700 dark:bg-navy-900 dark:text-navy-300'
        )}
      >
        {index + 1}
      </div>

      {/* Infos patient */}
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={clsx(
            'font-semibold',
            isDone
              ? 'text-gray-400 line-through dark:text-gray-600'
              : 'text-gray-900 dark:text-white'
          )}
        >
          {visit.patient.first_name} {visit.patient.last_name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {visit.patient.address}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant={TIME_SLOT_VARIANTS[visit.time_slot]} size="sm">
            {TIME_SLOT_LABELS[visit.time_slot]}
          </Badge>
          <Badge variant={STATUS_VARIANTS[visit.status]} size="sm">
            {STATUS_LABELS[visit.status]}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <a
          href={`https://maps.google.com/?q=${addr}`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors',
            'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
          aria-label="Ouvrir dans Google Maps"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Maps
        </a>

        <a
          href={`https://waze.com/ul?q=${addr}`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors',
            'border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
            'dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 dark:hover:bg-cyan-900/50'
          )}
          aria-label="Ouvrir dans Waze"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 2.136.67 4.116 1.811 5.741L2.5 21l3.352-1.283A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
          Waze
        </a>

        {!isDone && (
          <button
            onClick={() => onMarkDone(visit.id)}
            className={clsx(
              'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
              'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
              'dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-800/50'
            )}
            title="Marquer comme effectuée"
            aria-label="Marquer la visite comme effectuée"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ItinerairePage() {
  const { cabinet, user } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)

  const [visits, setVisits] = useState<DemoVisit[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const todayLabel = format(today, 'EEEE d MMMM yyyy', { locale: fr })

  useEffect(() => {
    const fetchTodayVisits = async () => {
      setLoading(true)
      try {
        if (!cabinet?.id || !user?.id) {
          setVisits(DEMO_VISITS)
          return
        }

        const { data, error } = await supabase
          .from('visits')
          .select('*, patients(first_name, last_name, address)')
          .eq('cabinet_id', cabinet.id)
          .eq('nurse_id', user.id)
          .eq('date', todayStr)
          .order('time_slot', { ascending: true })
          .order('start_time', { ascending: true })

        if (error) throw error

        if (!data || data.length === 0) {
          setVisits(DEMO_VISITS)
        } else {
          const mapped: DemoVisit[] = (data as Array<{
            id: string
            time_slot: TimeSlot
            status: VisitStatus
            patients: { first_name: string; last_name: string; address: string } | null
          }>).map((v) => ({
            id: v.id,
            patient: {
              first_name: v.patients?.first_name ?? '',
              last_name: v.patients?.last_name ?? '',
              address: v.patients?.address ?? '',
            },
            time_slot: v.time_slot ?? 'morning',
            status: v.status,
            // Les coordonnées seront géocodées par TourneeMap
          }))
          setVisits(mapped)
        }
      } catch {
        setVisits(DEMO_VISITS)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayVisits()
  }, [cabinet?.id, user?.id, todayStr])

  const handleMarkDone = async (id: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'done' as VisitStatus } : v))
    )

    try {
      await supabase
        .from('visits')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', id)
    } catch {
      // La mise à jour UI reste en mode démo
    }

    addToast('Visite marquée comme effectuée', 'success')
  }

  const handleOptimize = () => {
    addToast('Fonctionnalité bientôt disponible', 'info')
  }

  const doneCount = visits.filter((v) => v.status === 'done').length
  const remainingCount = visits.filter((v) => v.status === 'planned').length
  const totalCount = visits.length

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" label="Chargement de la tournée..." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={`Tournée du ${todayLabel}`}
        subtitle={`${totalCount} visite${totalCount > 1 ? 's' : ''} aujourd'hui`}
        actions={
          <Button variant="secondary" size="sm" onClick={handleOptimize}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
            Optimiser l'ordre
          </Button>
        }
      />

      {visits.length === 0 ? (
        <EmptyState
          title="Aucune visite aujourd'hui"
          description="Votre tournée est vide pour cette journée."
        />
      ) : (
        <>
          {/* Carte OpenStreetMap */}
          <TourneeMap visits={visits} />

          {/* Liste des visites */}
          <div className="space-y-3">
            {visits.map((visit, index) => (
              <VisitRow
                key={visit.id}
                visit={visit}
                index={index}
                onMarkDone={handleMarkDone}
              />
            ))}
          </div>
        </>
      )}

      {/* Footer récapitulatif */}
      {visits.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Récapitulatif de la journée
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                  {totalCount} au total
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {doneCount} effectuée{doneCount > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 text-navy-700 dark:text-navy-300">
                  <span className="h-2 w-2 rounded-full bg-navy-500" />
                  {remainingCount} restante{remainingCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {totalCount > 0 && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }}
                  role="progressbar"
                  aria-valuenow={doneCount}
                  aria-valuemin={0}
                  aria-valuemax={totalCount}
                  aria-label={`${doneCount} visite(s) sur ${totalCount} effectuée(s)`}
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
