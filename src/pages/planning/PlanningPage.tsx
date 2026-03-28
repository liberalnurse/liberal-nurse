// Planning mensuel — Calendrier Cabinet avec assignation infirmières T1/T2/T3
import { useState, useEffect, useMemo } from 'react'
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

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE: { cls: string; hex: string }[] = [
  { cls: 'bg-blue-500',    hex: '#3b82f6' },
  { cls: 'bg-violet-500',  hex: '#8b5cf6' },
  { cls: 'bg-emerald-500', hex: '#10b981' },
  { cls: 'bg-red-500',     hex: '#ef4444' },
  { cls: 'bg-orange-500',  hex: '#f97316' },
  { cls: 'bg-pink-500',    hex: '#ec4899' },
  { cls: 'bg-yellow-500',  hex: '#eab308' },
]

// Couleur stable par ID (hash simple)
function paletteForId(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tournee = 'T1' | 'T2' | 'T3'
const TOURNEES: Tournee[] = ['T1', 'T2', 'T3']
const JOURS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

interface Nurse {
  id: string
  firstName: string
  lastName: string
  initials: string
  colorCls: string
  colorHex: string
}

interface Assignment {
  id: string
  infirmiere_id: string
  date: string
  tournee: Tournee
}

type AssignMap = Record<string, Record<Tournee, Assignment[]>>

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeNurse(raw: { id: string; full_name: string }): Nurse {
  const parts     = raw.full_name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.slice(1).join(' ')
  const initials  = (lastName || firstName).substring(0, 2).toUpperCase()
  const { cls, hex } = paletteForId(raw.id)
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
    for (const [nurseId, tournee] of p)
      items.push({ id: `d${n++}`, infirmiere_id: nurseId, date: format(d, 'yyyy-MM-dd'), tournee })
  }
  return items
}

const DEMO_ASSIGNMENTS = buildDemoAssignments()

// ─── Exports PDF (lazy jsPDF) ─────────────────────────────────────────────────

async function exportComplet(currentDate: Date, assignMap: AssignMap, nurses: Nurse[]) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc  = new jsPDF({ orientation: 'landscape' })
  const mon  = format(currentDate, 'MMMM yyyy', { locale: fr })
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Planning Cabinet - ${mon}`, 14, 16)

  const rows = days.map((day) => {
    const da = assignMap[format(day, 'yyyy-MM-dd')]
    const names = (t: Tournee) =>
      (da?.[t] ?? []).map((a) => nurses.find((n) => n.id === a.infirmiere_id)?.firstName ?? '').filter(Boolean).join(', ') || '-'
    return [format(day, 'EEE d MMM', { locale: fr }), names('T1'), names('T2'), names('T3')]
  })

  autoTable(doc, {
    head: [['Jour', 'T1', 'T2', 'T3']],
    body: rows,
    startY: 24,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 45, 92], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 34 } },
  })
  doc.save(`planning-complet-${format(currentDate, 'yyyy-MM')}.pdf`)
}

async function exportParInfirmiere(currentDate: Date, assignMap: AssignMap, nurse: Nurse) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc  = new jsPDF()
  const mon  = format(currentDate, 'MMMM yyyy', { locale: fr })
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Planning - ${nurse.firstName} ${nurse.lastName} - ${mon}`, 14, 16)

  const rows = days.flatMap((day) => {
    const da = assignMap[format(day, 'yyyy-MM-dd')]
    const ts = TOURNEES.filter((t) => da?.[t]?.some((a) => a.infirmiere_id === nurse.id))
    return ts.map((t) => [format(day, 'EEE d MMM', { locale: fr }), t])
  })

  autoTable(doc, {
    head: [['Jour', 'Tournee']],
    body: rows.length ? rows : [['Aucune assignation', '']],
    startY: 24,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 45, 92], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
  })
  doc.save(`planning-${nurse.firstName.toLowerCase()}-${format(currentDate, 'yyyy-MM')}.pdf`)
}

async function exportParTournee(currentDate: Date, assignMap: AssignMap, nurses: Nurse[], tournee: Tournee) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc  = new jsPDF()
  const mon  = format(currentDate, 'MMMM yyyy', { locale: fr })
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Planning ${tournee} - ${mon}`, 14, 16)

  const rows = days.map((day) => {
    const as = assignMap[format(day, 'yyyy-MM-dd')]?.[tournee] ?? []
    const nms = as.map((a) => nurses.find((n) => n.id === a.infirmiere_id)?.firstName ?? '').filter(Boolean).join(', ')
    return [format(day, 'EEE d MMM', { locale: fr }), nms || '-']
  })

  autoTable(doc, {
    head: [['Jour', 'Infirmieres']],
    body: rows,
    startY: 24,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 45, 92], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
  })
  doc.save(`planning-${tournee.toLowerCase()}-${format(currentDate, 'yyyy-MM')}.pdf`)
}

// ─── Modal PDF ────────────────────────────────────────────────────────────────

function PdfModal({ currentDate, assignMap, nurses, onClose }: {
  currentDate: Date
  assignMap: AssignMap
  nurses: Nurse[]
  onClose: () => void
}) {
  const [nurseId,  setNurseId]  = useState(nurses[0]?.id ?? '')
  const [tournee,  setTournee]  = useState<Tournee>('T1')
  const [loading,  setLoading]  = useState<string | null>(null)

  const run = async (key: string, fn: () => Promise<void>) => {
    setLoading(key)
    try { await fn() } finally { setLoading(null) }
    onClose()
  }

  const nurse = nurses.find((n) => n.id === nurseId) ?? nurses[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-bold text-navy-900 dark:text-white">Export PDF</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {/* Planning complet */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Planning complet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tout le mois · toutes les infirmières</p>
            </div>
            <button
              onClick={() => run('complet', () => exportComplet(currentDate, assignMap, nurses))}
              disabled={loading === 'complet'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-navy-600"
            >
              {loading === 'complet' ? '...' : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  PDF
                </>
              )}
            </button>
          </div>

          {/* Par infirmière */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Par infirmière</p>
            <div className="flex items-center gap-2">
              <select
                value={nurseId}
                onChange={(e) => setNurseId(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {nurses.map((n) => (
                  <option key={n.id} value={n.id}>{n.firstName} {n.lastName}</option>
                ))}
              </select>
              <button
                onClick={() => nurse && run('inf', () => exportParInfirmiere(currentDate, assignMap, nurse))}
                disabled={loading === 'inf' || !nurse}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-navy-600"
              >
                {loading === 'inf' ? '...' : 'PDF'}
              </button>
            </div>
          </div>

          {/* Par tournée */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Par tournée</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {TOURNEES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTournee(t)}
                    className={clsx(
                      'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                      tournee === t
                        ? 'bg-navy-800 text-white dark:bg-navy-600'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => run('t', () => exportParTournee(currentDate, assignMap, nurses, tournee))}
                disabled={loading === 't'}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-navy-600"
              >
                {loading === 't' ? '...' : 'PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Cellule calendrier — T1/T2/T3 avec border-left colorée ──────────────────

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

  // Pour le filtre : on vérifie si au moins une tournée contient l'infirmière filtrée
  const hasFiltered = filterNurseId
    ? TOURNEES.some((t) => (dayAssign?.[t] ?? []).some((a) => a.infirmiere_id === filterNurseId))
    : true
  const dimmed = filterNurseId && !hasFiltered

  // Première infirmière assignée à une tournée (en tenant compte du filtre)
  const firstForTournee = (t: Tournee): Nurse | null => {
    const list = dayAssign?.[t] ?? []
    const filtered = filterNurseId ? list.filter((a) => a.infirmiere_id === filterNurseId) : list
    const first = filtered[0] ?? list[0]
    if (!first) return null
    if (filterNurseId && first.infirmiere_id !== filterNurseId) return null
    return nurseById(first.infirmiere_id) ?? null
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex min-h-[84px] w-full flex-col items-start border-b border-r border-gray-100 p-1 text-left transition-colors dark:border-gray-800',
        day.getDay() === 0 && 'border-r-0',
        !isCurrentMonth && 'opacity-30',
        dimmed && 'opacity-15',
        isSelected
          ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 dark:bg-blue-950/30 dark:ring-blue-400'
          : isWeekend
          ? 'bg-gray-50/80 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/40'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/30',
      )}
    >
      {/* Numéro du jour */}
      <span className={clsx(
        'mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
        todayFlag
          ? 'bg-blue-600 font-bold text-white'
          : isSelected
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400',
      )}>
        {format(day, 'd')}
      </span>

      {/* Lignes T1 / T2 / T3 */}
      <div className="flex w-full flex-col gap-[3px]">
        {TOURNEES.map((t) => {
          const nurse = firstForTournee(t)
          return (
            <div key={t} className="flex items-center gap-[3px] overflow-hidden">
              {/* Trait coloré (border-left) */}
              <div
                className="h-[11px] w-[3px] flex-shrink-0 rounded-full"
                style={{ backgroundColor: nurse ? nurse.colorHex : 'transparent' }}
              />
              {/* Texte : masqué sur mobile, visible sur desktop */}
              <span className={clsx(
                'hidden sm:block truncate text-[9px] leading-[11px] font-medium',
                nurse
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-300 dark:text-gray-600',
              )}>
                {nurse ? `${t} · ${nurse.firstName}` : `${t} · —`}
              </span>
            </div>
          )
        })}
      </div>
    </button>
  )
}

// ─── Ligne tournée dans le panneau — badges toggle ────────────────────────────

function TourneeRow({ tournee, assigns, nurses, onRemove, onAdd }: {
  tournee: Tournee
  assigns: Assignment[]
  nurses: Nurse[]
  onRemove: (a: Assignment) => void
  onAdd: (nurseId: string) => void
}) {
  const LABEL_COLOR: Record<Tournee, string> = {
    T1: 'text-blue-700 dark:text-blue-400',
    T2: 'text-violet-700 dark:text-violet-400',
    T3: 'text-emerald-700 dark:text-emerald-400',
  }

  return (
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-3.5 last:border-0 dark:border-gray-800">
      {/* Label tournée */}
      <span className={clsx('w-7 flex-shrink-0 pt-0.5 text-sm font-bold', LABEL_COLOR[tournee])}>
        {tournee}
      </span>

      {/* Badges toggle pour chaque infirmière */}
      <div className="flex flex-1 flex-wrap gap-1.5">
        {nurses.map((n) => {
          const assignment = assigns.find((a) => a.infirmiere_id === n.id)
          const assigned   = !!assignment
          return (
            <button
              key={n.id}
              onClick={() => assigned ? onRemove(assignment!) : onAdd(n.id)}
              className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                assigned ? 'text-white shadow-sm' : '',
              )}
              style={assigned
                ? { backgroundColor: n.colorHex }
                : { border: `1.5px solid ${n.colorHex}`, color: n.colorHex }
              }
            >
              <span className="text-[10px] font-bold" style={{ opacity: assigned ? 0.75 : 1 }}>
                {n.initials}
              </span>
              {n.firstName}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Panneau d'assignation ────────────────────────────────────────────────────

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
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-900 dark:text-white">
          {title}
        </h3>
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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

// ─── Modal infirmières ────────────────────────────────────────────────────────

function NursesModal({ nurses, onClose }: { nurses: Nurse[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-bold text-navy-900 dark:text-white">Infirmières du cabinet</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
          {nurses.map((n) => (
            <div key={n.id} className="flex items-center gap-3 px-5 py-3">
              <div className={clsx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', n.colorCls)}>
                {n.initials}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.firstName} {n.lastName}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 px-5 py-3 text-center dark:border-gray-800">
          <p className="text-xs text-gray-400">Gérer les infirmières depuis la page Administration</p>
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
  const [showPdfModal,    setShowPdfModal]    = useState(false)
  const [isMobile,        setIsMobile]        = useState(() => window.innerWidth < 1024)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    if (!cabinet?.id) return
    supabase.from('users').select('id, full_name').eq('cabinet_id', cabinet.id)
      .then(({ data, error }) => {
        if (!error && data?.length) setNurses((data as { id: string; full_name: string }[]).map(makeNurse))
      })
  }, [cabinet?.id])

  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
  useEffect(() => {
    if (!cabinet?.id) return
    supabase.from('planning_assignments')
      .select('id, infirmiere_id, date, tournee')
      .eq('cabinet_id', cabinet.id)
      .gte('date', format(startOfMonth(currentDate), 'yyyy-MM-dd'))
      .lte('date', format(endOfMonth(currentDate),   'yyyy-MM-dd'))
      .then(({ data, error }) => { if (!error && data) setAssignments(data as Assignment[]) })
  }, [cabinet?.id, monthKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const assignMap = useMemo<AssignMap>(() => {
    const map: AssignMap = {}
    for (const a of assignments) {
      if (!map[a.date]) map[a.date] = { T1: [], T2: [], T3: [] }
      map[a.date][a.tournee].push(a)
    }
    return map
  }, [assignments])

  const days = useMemo(() => {
    const s = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const e = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 1 })
    return eachDayOfInterval({ start: s, end: e })
  }, [currentDate])

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    if (isMobile) setPanelOpen(true)
  }

  const handleRemove = async (a: Assignment) => {
    setAssignments((prev) => prev.filter((x) => x.id !== a.id))
    if (a.id.startsWith('d') || !cabinet?.id) return
    const { error } = await supabase.from('planning_assignments').delete().eq('id', a.id)
    if (error) { setAssignments((prev) => [...prev, a]); addToast('Erreur suppression', 'error') }
  }

  const handleAdd = async (tournee: Tournee, nurseId: string) => {
    const dateStr = format(selectedDay, 'yyyy-MM-dd')
    const tempId  = `tmp-${Date.now()}`
    setAssignments((prev) => [...prev, { id: tempId, infirmiere_id: nurseId, date: dateStr, tournee }])
    if (!cabinet?.id) return
    const { data, error } = await supabase
      .from('planning_assignments')
      .insert({ cabinet_id: cabinet.id, infirmiere_id: nurseId, date: dateStr, tournee })
      .select('id, infirmiere_id, date, tournee').single()
    if (error) {
      setAssignments((prev) => prev.filter((x) => x.id !== tempId))
      addToast("Erreur ajout", 'error')
    } else if (data) {
      setAssignments((prev) => prev.map((x) => x.id === tempId ? (data as Assignment) : x))
    }
  }

  const toggleFilter = (id: string) => setFilterNurseId((prev) => prev === id ? null : id)

  return (
    <div className="flex flex-col gap-4 pb-24 lg:pb-4">

      {/* ── Header ── */}
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
            onClick={() => setShowPdfModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* ── Badges infirmières ── */}
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
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Effacer
          </button>
        )}
      </div>

      {/* ── Navigation mois ── */}
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

      {/* ── Grille calendrier ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {JOURS.map((j) => (
            <div key={j} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {j}
            </div>
          ))}
        </div>
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

      {/* ── Panneau desktop ── */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900 lg:block">
        <AssignmentPanel
          selectedDay={selectedDay}
          assignMap={assignMap}
          nurses={nurses}
          onRemove={handleRemove}
          onAdd={handleAdd}
        />
      </div>

      {/* ── Sheet mobile — overlay ── */}
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-black/30 transition-opacity duration-300 lg:hidden',
          panelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setPanelOpen(false)}
      />
      {/* Sheet mobile — panneau */}
      <div
        className={clsx(
          'fixed inset-x-0 bottom-0 z-40 overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 lg:hidden',
          'transition-transform duration-300 ease-out',
          panelOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
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
        <div className="h-6" />
      </div>

      {/* ── Modals ── */}
      {showNursesModal && <NursesModal nurses={nurses} onClose={() => setShowNursesModal(false)} />}
      {showPdfModal && (
        <PdfModal
          currentDate={currentDate}
          assignMap={assignMap}
          nurses={nurses}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  )
}
