// Statistiques et analytics du cabinet
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

const visitesData = [
  { mois: 'Août',  visites: 312 },
  { mois: 'Sep',   visites: 298 },
  { mois: 'Oct',   visites: 341 },
  { mois: 'Nov',   visites: 289 },
  { mois: 'Déc',   visites: 254 },
  { mois: 'Jan',   visites: 378 },
]

const actesData = [
  { name: 'AMI 2', count: 145 },
  { name: 'AMI 1', count: 98 },
  { name: 'AMI 3', count: 67 },
  { name: 'AIS 1', count: 54 },
  { name: 'AIS 2', count: 32 },
  { name: 'Autres', count: 45 },
]

const repartitionData = [
  { name: 'Matin',       value: 58, color: '#0f2d5c' },
  { name: 'Après-midi',  value: 28, color: '#3b82f6' },
  { name: 'Soir',        value: 14, color: '#93c5fd' },
]

const kpis = [
  { label: 'Visites ce mois',    value: '378',    sub: '+24 % vs mois dernier', up: true },
  { label: 'Patients actifs',    value: '48',     sub: '+3 nouveaux ce mois',   up: true },
  { label: 'Actes réalisés',     value: '441',    sub: 'toutes catégories',     up: null },
  { label: 'CA estimé',          value: '18 240 €', sub: 'avant charges',       up: null },
]

export default function StatistiquesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Statistiques" subtitle="Vue d'ensemble de l'activité du cabinet" />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, sub, up }) => (
          <Card key={label}>
            <CardBody>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              {sub && (
                <p className={`text-xs ${up === true ? 'text-green-600 dark:text-green-400' : up === false ? 'text-red-500' : 'text-gray-400'}`}>
                  {up === true && '↑ '}{up === false && '↓ '}{sub}
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Évolution visites */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Évolution des visites — 6 derniers mois</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={visitesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVisites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0f2d5c" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0f2d5c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="visites" stroke="#0f2d5c" strokeWidth={2} fill="url(#gradVisites)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Répartition par acte */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Répartition par acte</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={actesData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" fill="#0f2d5c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Répartition horaire */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-navy-900 dark:text-white">Répartition horaire</h2>
          </CardHeader>
          <CardBody className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={repartitionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {repartitionData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} %`, '']} contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
