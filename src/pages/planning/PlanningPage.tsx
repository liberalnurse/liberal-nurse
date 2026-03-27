// Planning mensuel — assignation des infirmières par tournée (T1/T2/T3)
import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay,
  isToday, addMonths, subMonths, addDays,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotId = 'T1' | 'T2' | 'T3'
type DayAssignment = Record<SlotId, string | null>   // null = pas d'infirmière
type PlanState     = Record<string, DayAssignment>   // clé = 'yyyy-MM-dd'

// ─── Infirmières du cabinet (données démo) ────────────────────────────────────

const NURSES: { id: string; firstName: string; lastName: string; color: string }[] = [
  { id: 'n1', firstName: 'Sophie',  lastName: 'Leblanc', color: 'bg-blue-500' },
  { id: 'n2', firstName: 'Marie',   lastName: 'Côté',    color: 'bg-violet-500' },
  { id: 'n3', firstName: 'Claire',  lastName: 'Bernard', color: 'bg-emerald-500' },
  { id: 'n4', firstName: 'Émilie',  lastName: 'Faure',   color: 'bg-amber-500' },
]

const nurseById = (id: string | null) => id ? NURSES.find((n) => n.id === id) ?? null : null

// ─── Données mockées ──────────────────────────────────────────────────────────

const TODAY = new Date()

function makeAssignment(t1: string | null, t2: string | null, t3: string | null): DayAssignment {
  return { T1: t1, T2: t2, T3: t3 }
}

const MOCK_PLANS: PlanState = {}
const PATTERNS: Array<[string | null, string | null, string | null]> = [
  ['n1', 'n2', 'n3'],
  ['n1', 'n2', null],
  ['n2', 'n1', 'n4'],
  ['n1', 'n3', 'n2'],
  ['n1', 'n2', 'n3'],
  ['n3', 'n1', 'n2'],
  ['n1', 'n4', 'n2'],
]
for (let offset = -15; offset <= 20; offset++) {
  const d = addDays(TODAY, offset)
  if (d.getDay() !== 0) { // pas le dimanche
    const p = PATTERNS[((offset + 15) % PATTERNS.length + PATTERNS.length) % PATTERNS.length]
    MOCK_PLANS[format(d, 'yyyy-MM-dd')] = makeAssignment(...p)
  }
}

// ─── Config des tournées ──────────────────────────────────────────────────────

const SLOTS: { id: SlotId; badge: string; pill: string; dot: string }[] = [
  { id: 'T1', badge: 'bg-blue-600 text-white',    pill: 'bg-blue-50 dark:bg-blue-950/50',    dot: 'bg-blue-500' },
  { id: 'T2', badge: 'bg-violet-600 text-white',  pill: 'bg-violet-50 dark:bg-violet-950/50',dot: 'bg-violet-500' },
  { id: 'T3', badge: 'bg-emerald-600 text-white', pill: 'bg-emerald-50 dark:bg-emerald-950/50',dot: 'bg-emerald-500' },
]

const JOURS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

// ─── Cellule calendrier ───────────────────────────────────────────────────────

function DayCell({ day, assignment, isSelected, isCurrentMonth, onClick }: {
  day: Date
  assignment?: DayAssignment
  isSelected: boolean
  isCurrentMonth: boolean
  onClick: () => void
}) {
  const isTodayDay = isToday(day)
  const isWeekend  = day.getDay() === 0 || day.getDay() === 6

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex min-h-[82px] w-full flex-col items-start border-b border-r border-gray-100 p-1.5 text-left transition-colors dark:border-gray-800',
        day.getDay() === 0 && 'border-r-0',
        !isCurrentMonth && 'opacity-25',
        isSelected
          ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 dark:bg-blue-950/30 dark:ring-blue-400'
          : isWeekend
          ? 'bg-gray-50/70 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/40'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/30',
      )}
    >
      {/* Numéro du jour */}
      <span className={clsx(
        'mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
        isTodayDay
          ? 'bg-blue-600 font-bold text-white'
          : 'text-gray-600 dark:text-gray-400',
      )}>
        {format(day, 'd')}
      </span>

      {/* T1 / T2 / T3 */}
      {SLOTS.map((slot) => {
        const nurse = assignment ? nurseById(assignment[slot.id]) : null
        return (
          <div key={slot.id} className="flex w-full items-center gap-1 overflow-hidden">
            <span className={clsx('flex-shrink-0 rounded px-1 py-px text-[9px] font-bold leading-none', slot.badge)}>
              {slot.id}
            </span>
            <span className={clsx('truncate text-[10px] leading-tight', nurse ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600')}>
              {nurse ? nurse.firstName : '—'}
            </span>
          </div>
        )
      })}
    </button>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [currentDate, setCurrentDate]   = useState(new Date())
  const [selectedDay, setSelectedDay]   = useState<Date>(new Date())
  const [plans, setPlans]               = useState<PlanState>(MOCK_PLANS)
  // Édition locale du jour sélectionné (avant sauvegarde)
  const [editAssign, setEditAssign]     = useState<DayAssignment | null>(null)
  // Dropdown ouvert pour quel slot
  const [openDropdown, setOpenDropdown] = useState<SlotId | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end   = endOfWeek(endOfMonth(currentDate),   { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const selectedKey = format(selectedDay, 'yyyy-MM-dd')
  // L'assignation affichée dans le panneau = édition en cours ou plan sauvegardé
  const panelAssign: DayAssignment = editAssign ?? plans[selectedKey] ?? { T1: null, T2: null, T3: null }
  const isDirty = editAssign !== null

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    setEditAssign(null)       // reset édition quand on change de jour
    setOpenDropdown(null)
  }

  const handleSetNurse = (slot: SlotId, nurseId: string | null) => {
    setEditAssign({ ...panelAssign, [slot]: nurseId })
    setOpenDropdown(null)
  }

  const handleSave = () => {
    if (!editAssign) return
    setPlans((prev) => ({ ...prev, [selectedKey]: editAssign }))
    setEditAssign(null)
  }

  const handleCancel = () => {
    setEditAssign(null)
    setOpenDropdown(null)
  }

  const panelTitle = format(selectedDay, 'EEEE d MMMM', { locale: fr }).toUpperCase()

  return (
    <div className="flex flex-col gap-3" onClick={() => setOpenDropdown(null)}>

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-navy-900 dark:text-white">Planning</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            Infirmières
          </Button>
          <Button variant="secondary" size="sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            PDF
          </Button>
        </div>
      </div>

      {/* ── Navigation mois ── */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-900">
        <button
          onClick={() => { setCurrentDate((d) => subMonths(d, 1)); setEditAssign(null) }}
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
          onClick={() => { setCurrentDate((d) => addMonths(d, 1)); setEditAssign(null) }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* ── Grille calendrier ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
        {/* LUN → DIM */}
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
              assignment={plans[format(day, 'yyyy-MM-dd')]}
              isSelected={isSameDay(day, selectedDay)}
              isCurrentMonth={isSameMonth(day, currentDate)}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>
      </div>

      {/* ── Panneau bas : assignation du jour ── */}
      <div
        className="overflow-visible rounded-2xl bg-white shadow-sm dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titre */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy-900 dark:text-white">
            {panelTitle}
          </h3>
          {isDirty && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancel}>Annuler</Button>
              <Button size="sm" onClick={handleSave}>Sauvegarder</Button>
            </div>
          )}
        </div>

        {/* T1 / T2 / T3 */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {SLOTS.map((slot) => {
            const nurse = nurseById(panelAssign[slot.id])
            const isOpen = openDropdown === slot.id

            return (
              <div key={slot.id} className={clsx('flex items-center gap-4 px-5 py-4', slot.pill)}>
                {/* Badge tournée */}
                <span className={clsx('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold', slot.badge)}>
                  {slot.id}
                </span>

                {/* Infirmière assignée */}
                <div className="flex-1 min-w-0">
                  {nurse ? (
                    <div className="flex items-center gap-2">
                      <span className={clsx('h-2.5 w-2.5 rounded-full flex-shrink-0', nurse.color)} />
                      <span className="text-sm font-semibold text-navy-900 dark:text-white">
                        {nurse.firstName} {nurse.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Aucune infirmière assignée</span>
                  )}
                </div>

                {/* Bouton retirer */}
                {nurse && (
                  <button
                    onClick={() => handleSetNurse(slot.id, null)}
                    className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400 dark:text-gray-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                    title="Retirer cette infirmière"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Dropdown changer infirmière */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : slot.id) }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {nurse ? 'Changer' : 'Assigner'}
                    <svg className="ml-1.5 inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      {NURSES.map((n) => (
                        <button
                          key={n.id}
                          onClick={(e) => { e.stopPropagation(); handleSetNurse(slot.id, n.id) }}
                          className={clsx(
                            'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
                            panelAssign[slot.id] === n.id && 'font-semibold text-navy-800 dark:text-white',
                          )}
                        >
                          <span className={clsx('h-2 w-2 rounded-full flex-shrink-0', n.color)} />
                          {n.firstName} {n.lastName}
                          {panelAssign[slot.id] === n.id && (
                            <svg className="ml-auto h-3.5 w-3.5 text-navy-600 dark:text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      ))}
                      {nurse && (
                        <>
                          <div className="mx-3 border-t border-gray-100 dark:border-gray-700" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetNurse(slot.id, null) }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                            Retirer
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bouton Sauvegarder global (bas du panneau, visible seulement si modif) */}
        {isDirty && (
          <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <Button fullWidth onClick={handleSave}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Sauvegarder les changements
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
