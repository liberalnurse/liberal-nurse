// Tableau de bord principal avec KPIs, agenda, transmissions, stock et graphique
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

// ─── Données mockées ─────────────────────────────────────────────────────────

const mockVisitesToday = [
  { id: '1', patient: 'Marie Dupont',    time: '08:00', status: 'done',    acte: 'AMI 2' },
  { id: '2', patient: 'Jean Martin',     time: '09:30', status: 'done',    acte: 'AIS 1' },
  { id: '3', patient: 'Paulette Renard', time: '10:15', status: 'planned', acte: 'AMI 3' },
  { id: '4', patient: 'Henri Leblanc',   time: '14:00', status: 'planned', acte: 'AMI 1' },
  { id: '5', patient: 'Colette Simon',   time: '15:30', status: 'planned', acte: 'AMI 2' },
]

const mockTransmissions = [
  { id: '1', content: 'Patient Dupont : pression artérielle très élevée ce matin', priority: 'urgent', time: 'Il y a 1h' },
  { id: '2', content: 'Renouvellement ordonnance à prévoir pour Henri Leblanc',     priority: 'high',   time: 'Il y a 3h' },
  { id: '3', content: 'RAS pour la tournée du matin',                               priority: 'normal', time: 'Il y a 4h' },
  { id: '4', content: 'Visite annulée : Colette Simon hospitalisée',                priority: 'high',   time: 'Hier' },
  { id: '5', content: 'Stock seringues 5mL presque épuisé',                         priority: 'normal', time: 'Hier' },
]

const mockStockAlerts = [
  { id: '1', name: 'Seringues 5mL',      quantity: 3,  threshold: 10, unit: 'boîtes' },
  { id: '2', name: 'Compresses stériles', quantity: 8,  threshold: 20, unit: 'sachets' },
  { id: '3', name: 'Gants latex M',       quantity: 12, threshold: 50, unit: 'paires' },
]

const mockChartData = [
  { jour: 'Lun', visites: 12 },
  { jour: 'Mar', visites: 15 },
  { jour: 'Mer', visites: 11 },
  { jour: 'Jeu', visites: 18 },
  { jour: 'Ven', visites: 14 },
  { jour: 'Sam', visites: 9 },
  { jour: 'Dim', visites: 6 },
]

// ─── Sous-composants ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card variant="hover">
      <CardBody className="flex items-center gap-4">
        <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', color)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-navy-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  )
}

const priorityBadge: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  low:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const priorityLabel: Record<string, string> = {
  urgent: 'Urgent',
  high:   'Élevée',
  normal: 'Normal',
  low:    'Basse',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  done:      { label: 'Fait',   color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  planned:   { label: 'Prévu',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  absent:    { label: 'Absent', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()

  const prenom = useMemo(() => {
    if (!user?.full_name) return 'Infirmière'
    return user.full_name.split(' ')[0]
  }, [user?.full_name])

  const dateAujourdhui = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  const visitesFinies = mockVisitesToday.filter((v) => v.status === 'done').length
  const urgentes      = mockTransmissions.filter((t) => t.priority === 'urgent').length

  return (
    <div className="space-y-6">
      {/* Salutation */}
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-white lg:text-3xl">
          Bonjour {prenom} 👋
        </h1>
        <p className="mt-1 capitalize text-sm text-gray-500 dark:text-gray-400">{dateAujourdhui}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Visites aujourd'hui"
          value={`${visitesFinies}/${mockVisitesToday.length}`}
          sub="dont 2 urgentes"
          color="bg-navy-100 dark:bg-navy-900"
          icon={
            <svg className="h-6 w-6 text-navy-700 dark:text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
          }
        />
        <KpiCard
          label="Patients actifs"
          value={48}
          sub="3 nouveaux ce mois"
          color="bg-green-100 dark:bg-green-950"
          icon={
            <svg className="h-6 w-6 text-green-700 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          }
        />
        <KpiCard
          label="Transmissions urgentes"
          value={urgentes}
          color="bg-red-100 dark:bg-red-950"
          icon={
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          }
        />
        <KpiCard
          label="Articles en alerte stock"
          value={mockStockAlerts.length}
          color="bg-orange-100 dark:bg-orange-950"
          icon={
            <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          }
        />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">

        {/* Agenda du jour */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Agenda du jour</h2>
            <Link to="/planning" className="text-xs text-navy-600 hover:underline dark:text-navy-400">Voir tout</Link>
          </CardHeader>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {mockVisitesToday.map((visit) => {
              const st = statusConfig[visit.status]
              return (
                <div key={visit.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-12 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">{visit.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{visit.patient}</p>
                    <p className="text-xs text-gray-400">{visit.acte}</p>
                  </div>
                  <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', st.color)}>{st.label}</span>
                </div>
              )
            })}
          </div>
          <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <Link to="/itineraire" className="text-xs font-medium text-navy-600 hover:underline dark:text-navy-400">Voir la tournée →</Link>
          </div>
        </Card>

        {/* Dernières transmissions */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Transmissions récentes</h2>
            <Link to="/transmissions" className="text-xs text-navy-600 hover:underline dark:text-navy-400">Voir tout</Link>
          </CardHeader>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {mockTransmissions.map((t) => (
              <div key={t.id} className="flex gap-3 px-5 py-3">
                <span className={clsx('mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', priorityBadge[t.priority])}>
                  {priorityLabel[t.priority]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{t.content}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Graphique visites 7 jours */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Visites — 7 derniers jours</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={mockChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0f2d5c" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0f2d5c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(value: number) => [`${value} visites`, '']}
                />
                <Area type="monotone" dataKey="visites" stroke="#0f2d5c" strokeWidth={2} fill="url(#colorVisites)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

      </div>

      {/* Stock en alerte */}
      {mockStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">
              Stock en alerte
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                {mockStockAlerts.length}
              </span>
            </h2>
            <Link to="/stock" className="text-xs text-navy-600 hover:underline dark:text-navy-400">Gérer le stock</Link>
          </CardHeader>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
            {mockStockAlerts.map((item) => {
              const pct = Math.round((item.quantity / item.threshold) * 100)
              return (
                <div key={item.id} className="rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{item.quantity} {item.unit} (seuil : {item.threshold})</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-red-200 dark:bg-red-900">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
