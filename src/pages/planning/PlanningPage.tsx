// Planning mensuel — Calendrier Cabinet avec assignation infirmières T1/T2/T3
import { useState, useEffect, useMemo, useRef } from 'react'
import { clsx } from 'clsx'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  isToday, addMonths, subMonths, addDays,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

// ─── Palette de couleurs infirmières ──────────────────────────────────────────

const PALETTE: { cls: string; hex: string }[] = [
  { cls: 'bg-blue-500',     hex: '#3b82f6' },
  { cls: 'bg-violet-500',   hex: '#8b5cf6' },
  { cls: 'bg-emerald-500',  hex: '#10b981' },
  { cls: 'bg-red-500',      hex: '#ef4444' },
  { cls: 'bg-orange-500',   hex: '#f97316' },
  { cls: 'bg-pink-500',     hex: '#ec4899' },
  { cls: 'bg-yellow-500',   hex: '#eab308' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type Tournee = 'T1' | 'T2' | 'T3'
const TOURNEES: Tournee[] = ['T1', 'T2', 'T3']
const JOURS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

interface Nurse {
  id: string
  firstName: string
  lastName: string
  initials: string   // 2 premières lettres du nom de famille, ex: "LE"
  colorCls: string   // classe Tailwind
  colorHex: string   // hex pour inline style
}

interface Assignment {
  id: string
  infirmiere_id: string
  date: string       // 'yyyy-MM-dd'
  tournee: Tournee
}

type AssignMap = Record<string, Record<Tournee, Assignment[]>>

// ─── Helper : construire un Nurse depuis un row Supabase ──────────────────────

function makeNurse(raw: { id: string; full_name: string }, idx: number): Nurse {
  const parts     = raw.full_name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.slice(1).join(' ')
  const initials  = (lastName || firstName).substring(0, 2).toUpperCase()
  const { cls, hex } = PALETTE[idx % PALETTE.length]
  return { id: raw.id, firstName, lastName, initials, colorCls: cls, colorHex: hex }
}

// ─── Données démo ─────────────────────────────────────────────────────────────

const DEMO_NURSES: Nurse[] = [
  { id: 'n1', firstName: 'Sophie',  lastName: 'Leblanc', initials: 'LE', colorCls: 'bg-blue-500',    colorHex: '#3b82f6' },
  { id: 'n2', firstName: 'Marie',   lastName: 'Côté',    initials: 'CÔ', colorCls: 'bg-violet-500',  colorHex: '#8b5cf6' },
  { id: 'n3', firstName: 'Claire',  lastName: 'Bernard', initials: 'BE', colorCls: 'bg-emerald-500', colorHex: '#10b981' },
  { id: 'n4', firstName: 'Émilie',  lastName: 'Faure',   initials: 'FA', colorCls: 'bg-red-500',     colorHex: '#ef4444' },
]

function buildDemoAssignments(): Assignment[] {
  const today = new Date()
  const items: Assignment[] = []
  let n = 1
  const patterns: Array<[string, Tournee][]> = [
    [['n1','T1'],['n2','T2'],['n3','T3']],
    [['n1','T1'],['n3','T1'],['n2','T2']],
    [['n2','T1'],['n1','T2'],['n4','T3']],
    [['n3','T1'],['n1','T2'],['n2','T3']],
  ]
  for (let off = -20; off <= 30; off++) {
    const d = addDays(today, off)
    if (d.getDay() === 0) continue
    const p = patterns[((off + 20) % patterns.length + patterns.length) % patterns.length]
    for (const [nurseId, tournee] of p) {
      items.push({ id: `d${n++}`, infirmiere_id: nurseId, date: format(d, 'yyyy-MM-dd'), tournee })
    }
  }
  return items
}

const DEMO_ASSIGNMENTS = buildDemoAssignments()

// ─── Sous-composant : cellule calendrier ──────────────────────────────────────

function DayCell({ day, dayAssign, nurses, filterNurseId, isSelected, isCurrentMonth, onClick }: {
  day: Date
  dayAssign: Record<Tournee, Assignment[]> | undefined
  nurses: Nurse[]
  filterNurseId: string | null
  isSelected: boolean
  isCurrentMonth: boolean
  onClick: () => void
}) {
  const todayFlag = isToday(day)
  const isWeekend = day.getDay() === 0 || day.getDay() === 6
  const nurseById = (id: string) => nurses.find((n) => n.id === id)

  // Filtre : grise les jours sans l'infirmière sélectionnée
  const hasFilteredNurse = filterNurseId
    ? TOURNEES.some((t) => dayAssign?.[t]?.some((a) => a.infirmiere_id === filterNurseId))
    : true

  const TOURNEE_COLORS = ['text-blue-600 dark:text-blue-400', 'text-violet-600 dark:text-violet-400', 'text-emerald-600 dark:text-emerald-400']

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex min-h-[80px] w-full flex-col items-start border-b border-r border-gray-100 p-1.5 text-left transition-colors dark:border-gray-800',
        day.getDay() === 0 && 'border-r-0',
        !isCurrentMonth && 'opacity-30',
        filterNurseId && !hasFilteredNurse && 'opacity-20',
        isSelected
          ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 dark:bg-blue-950/30 dark:ring-blue-400'
          : isWeekend
          ? 'bg-gray-50/80 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/40'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/30',
      )}
    >
      {/* Numéro du jour */}
      <span className={clsx(
        'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
        todayFlag
          ? 'bg-blue-600 font-bold text-white'
          : isSelected
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400',
      )}>
        {format(day, 'd')}
      </span>

      {/* T1 / T2 / T3 */}
      {TOURNEES.map((tournee, ti) => {
        const assigns = dayAssign?.[tournee] ?? []
        const visible = filterNurseId
          ? assigns.filter((a) => a.infirmiere_id === filterNurseId)
          : assigns.slice(0, 1)
        const name = visible.length > 0
          ? (nurseById(visible[0].infirmiere_id)?.firstName ?? '')
          : ''
        return (
          <div key={tournee} className="flex w-full items-center gap-0.5 overflow-hidden">
            <span className={clsx('w-4 flex-shrink-0 text-[8px] font-bold leading-none', TOURNEE_COLORS[ti])}>
              {tournee}
            </span>
            <span className={clsx('truncate text-[9px] leading-tight', name ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600')}>
              {name || '—'}
            </span>
          </div>
        )
      })}
    </button>
  )
}

// ─── Sous-composant : ligne T1/T2/T3 dans le panneau ─────────────────────────

function TourneeRow({ tournee, assigns, nurses, onRemove, onAdd }: {
  tournee: Tournee
  assigns: Assignment[]
  nurses: Nurse[]
  onRemove: (a: Assignment) => void
  onAdd: (nurseId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const nurseById = (id: string) => nurses.find((n) => n.id === id)
  const available = nurses.filter((n) => !assigns.some((a) => a.infirmiere_id === n.id))

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const LABEL_CLS: Record<Tournee, string> = {
    T1: 'text-navy-800 dark:text-navy-300',
    T2: 'text-navy-800 dark:text-navy-300',
    T3: 'text-navy-800 dark:text-navy-300',
  }

  return (
    <div className="flex items-start gap-4 border-b border-gray-100 px-5 py-4 last:border-0 dark:border-gray-800">
      {/* Label tournée */}
      <span className={clsx('w-8 flex-shrink-0 pt-0.5 text-sm font-bold', LABEL_CLS[tournee])}>
        {tournee}
      </span>

      {/* Grille 2 colonnes des prénoms */}
      <div className="flex-1">
        {assigns.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {assigns.map((a) => {
              const nurse = nurseById(a.infirmiere_id)
              if (!nurse) return null
              return (
                <button
                  key={a.id}
                  onClick={() => onRemove(a)}
                  title={`Retirer ${nurse.firstName}`}
                  className="group flex items-center gap-1.5 text-left text-sm font-medium transition-opacity hover:opacity-60"
                  style={{ color: nurse.colorHex }}
                >
                  <span className={clsx('h-2 w-2 flex-shrink-0 rounded-full', nurse.colorCls)} />
                  <span className="group-hover:line-through">{nurse.firstName}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">Aucune infirmière</span>
        )}
      </div>

      {/* Bouton + (dropdown) */}
      {available.length > 0 && (
        <div className="relative flex-shrink-0" ref={dropRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-blue-500 hover:text-blue-500 dark:border-gray-600 dark:text-gray-500"
            title="Ajouter une infirmière"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {open && (
            <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[172px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
              {available.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { onAdd(n.id); setOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className={clsx('h-2.5 w-2.5 flex-shrink-0 rounded-full', n.colorCls)} />
                  <span className="text-gray-700 dark:text-gray-200">{n.firstName} {n.lastName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sous-composant : contenu du panneau d'assignation ────────────────────────

function AssignmentPanel({ selectedDay, assignMap, nurses, onRemove, onAdd, onClose, showClose }: {
  selectedDay: Date
  assignMap: AssignMap
  nurses: Nurse[]
  onRemove: (a: Assignment) => void
  onAdd: (tournee: Tournee, nurseId: string) => void
  onClose?: () => void
  showClose?: boolean
}) {
  const dateKey   = format(selectedDay, 'yyyy-MM-dd')
  const dayAssign = assignMap[dateKey] ?? { T1: [], T2: [], T3: [] }
  const title     = format(selectedDay, 'EEEE d MMMM', { locale: fr }).toUpperCase()

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white">
          {title}
        </h3>
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        )}
      </div>

      <div>
        {TOURNEES.map((t) => (
          <TourneeRow
            key={t}
            tournee={t}
            assigns={dayAssign[t]}
            nurses={nurses}
            onRemove={onRemove}
            onAdd={(nurseId) => onAdd(t, nurseId)}
          />
        ))}
      </div>
    </>
  )
}

// ─── Sous-composant : modal liste des infirmières ────────────────────────────

function NursesModal({ nurses, onClose }: { nurses: Nurse[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-bold text-navy-900 dark:text-white">Infirmières du cabinet</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {nurses.map((n) => (
            <div key={n.id} className="flex items-center gap-3 px-5 py-3">
              <div className={clsx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', n.colorCls)}>
                {n.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.firstName} {n.lastName}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-center dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Gérer les infirmières depuis la page Administration
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PlanningPage() {
  const { cabinet } = useAuthStore()
  const addToast    = useUIStore((s) => s.addToast)

  const [currentDate,     setCurrentDate]     = useState(new Date())
  const [selectedDay,     setSelectedDay]     = useState<Date>(new Date())
  const [panelOpen,       setPanelOpen]       = useState(false)
  const [nurses,          setNurses]          = useState<Nurse[]>(DEMO_NURSES)
  const [assignments,     setAssignments]     = useState<Assignment[]>(DEMO_ASSIGNMENTS)
  const [filterNurseId,   setFilterNurseId]   = useState<string | null>(null)
  const [showNursesModal, setShowNursesModal] = useState(false)
  const [isMobile,        setIsMobile]        = useState(() => window.innerWidth < 1024)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // ── Chargement des infirmières du cabinet ──────────────────────────────────
  useEffect(() => {
    if (!cabinet?.id) return
    supabase
      .from('users')
      .select('id, full_name')
      .eq('cabinet_id', cabinet.id)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setNurses((data as { id: string; full_name: string }[]).map(makeNurse))
        }
      })
  }, [cabinet?.id])

  // ── Chargement des assignations du mois courant ───────────────────────────
  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
  useEffect(() => {
    if (!cabinet?.id) return
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const end   = format(endOfMonth(currentDate),   'yyyy-MM-dd')
    supabase
      .from('planning_assignments')
      .select('id, infirmiere_id, date, tournee')
      .eq('cabinet_id', cabinet.id)
      .gte('date', start)
      .lte('date', end)
      .then(({ data, error }) => {
        if (!error && data) setAssignments(data as Assignment[])
      })
  }, [cabinet?.id, monthKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Map dérivée date → tournée → assignments ──────────────────────────────
  const assignMap = useMemo<AssignMap>(() => {
    const map: AssignMap = {}
    for (const a of assignments) {
      if (!map[a.date]) map[a.date] = { T1: [], T2: [], T3: [] }
      map[a.date][a.tournee].push(a)
    }
    return map
  }, [assignments])

  // ── Jours du calendrier (grille complète lun → dim) ───────────────────────
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end   = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // ── Clic sur un jour ──────────────────────────────────────────────────────
  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    if (isMobile) setPanelOpen(true)
  }

  // ── Retirer une infirmière d'un slot ──────────────────────────────────────
  const handleRemove = async (a: Assignment) => {
    setAssignments((prev) => prev.filter((x) => x.id !== a.id))
    if (a.id.startsWith('d') || !cabinet?.id) return
    const { error } = await supabase.from('planning_assignments').delete().eq('id', a.id)
    if (error) {
      setAssignments((prev) => [...prev, a])
      addToast('Erreur lors de la suppression', 'error')
    }
  }

  // ── Ajouter une infirmière à un slot ──────────────────────────────────────
  const handleAdd = async (tournee: Tournee, nurseId: string) => {
    const dateStr = format(selectedDay, 'yyyy-MM-dd')
    const tempId  = `tmp-${Date.now()}`
    const tempA: Assignment = { id: tempId, infirmiere_id: nurseId, date: dateStr, tournee }

    setAssignments((prev) => [...prev, tempA])
    if (!cabinet?.id) return

    const { data, error } = await supabase
      .from('planning_assignments')
      .insert({ cabinet_id: cabinet.id, infirmiere_id: nurseId, date: dateStr, tournee })
      .select('id, infirmiere_id, date, tournee')
      .single()

    if (error) {
      setAssignments((prev) => prev.filter((x) => x.id !== tempId))
      addToast("Erreur lors de l'ajout", 'error')
    } else if (data) {
      setAssignments((prev) => prev.map((x) => (x.id === tempId ? (data as Assignment) : x)))
    }
  }

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handlePdf = () => addToast('Export PDF bientôt disponible', 'info')

  // ── Filtre par infirmière ─────────────────────────────────────────────────
  const toggleFilter = (id: string) => setFilterNurseId((prev) => (prev === id ? null : id))

  return (
    <div className="flex flex-col gap-4 pb-24 lg:pb-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy-900 dark:text-white">Calendrier Cabinet</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNursesModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            Infirmières
          </button>
          <button
            onClick={handlePdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* ── Badges infirmières (scrollable) ────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {nurses.map((n) => (
          <button
            key={n.id}
            onClick={() => toggleFilter(n.id)}
            className={clsx(
              'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white transition-all',
              n.colorCls,
              filterNurseId === n.id ? 'shadow-md' : 'opacity-75 hover:opacity-100',
            )}
            style={filterNurseId === n.id ? { outline: '2.5px solid white', outlineOffset: '2px' } : undefined}
          >
            <span className="text-[11px] font-bold opacity-80">{n.initials}</span>
            {n.firstName}
          </button>
        ))}
        {filterNurseId && (
          <button
            onClick={() => setFilterNurseId(null)}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Effacer filtre
          </button>
        )}
      </div>

      {/* ── Navigation mois ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-900">
        <button
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-bold capitalize text-navy-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h2>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* ── Grille calendrier ───────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {JOURS.map((j) => (
            <div key={j} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {j}
            </div>
          ))}
        </div>
        {/* Cellules */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => (
            <DayCell
              key={idx}
              day={day}
              dayAssign={assignMap[format(day, 'yyyy-MM-dd')]}
              nurses={nurses}
              filterNurseId={filterNurseId}
              isSelected={isSameDay(day, selectedDay)}
              isCurrentMonth={isSameMonth(day, currentDate)}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>
      </div>

      {/* ── Panneau desktop (fixe, sous le calendrier) ──────────────────────── */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900 lg:block">
        <AssignmentPanel
          selectedDay={selectedDay}
          assignMap={assignMap}
          nurses={nurses}
          onRemove={handleRemove}
          onAdd={handleAdd}
        />
      </div>

      {/* ── Sheet mobile ────────────────────────────────────────────────────── */}
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-black/30 transition-opacity duration-300 lg:hidden',
          panelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setPanelOpen(false)}
      />
      {/* Panel */}
      <div
        className={clsx(
          'fixed inset-x-0 bottom-0 z-40 overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 lg:hidden',
          'transition-transform duration-300 ease-out',
          panelOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-2.5">
          <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <AssignmentPanel
          selectedDay={selectedDay}
          assignMap={assignMap}
          nurses={nurses}
          onRemove={handleRemove}
          onAdd={handleAdd}
          onClose={() => setPanelOpen(false)}
          showClose
        />
        {/* Safe area bas */}
        <div className="h-safe pb-4" />
      </div>

      {/* ── Modal infirmières ────────────────────────────────────────────────── */}
      {showNursesModal && (
        <NursesModal nurses={nurses} onClose={() => setShowNursesModal(false)} />
      )}
    </div>
  )
}
