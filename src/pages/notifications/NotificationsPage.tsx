// Page notifications
import { useState } from 'react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Notification } from '@/types'

const mockNotifications: Notification[] = [
  { id: '1', user_id: 'u1', cabinet_id: 'c1', title: 'Nouvelle transmission urgente', body: 'Marie Dupont : pression artérielle très élevée ce matin. Surveillance requise.', type: 'warning', read: false, link: '/transmissions', created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: '2', user_id: 'u1', cabinet_id: 'c1', title: 'Stock critique', body: 'Seringues 5mL : seulement 3 boîtes restantes (seuil : 10).', type: 'error', read: false, link: '/stock', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '3', user_id: 'u1', cabinet_id: 'c1', title: 'Nouveau message', body: 'Sophie Lefèvre vous a envoyé un message.', type: 'info', read: false, link: '/messagerie', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: '4', user_id: 'u1', cabinet_id: 'c1', title: 'Fiche de soins expirante', body: 'La fiche de soins de Paulette Renard expire dans 7 jours.', type: 'warning', read: true, link: '/fiches', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: '5', user_id: 'u1', cabinet_id: 'c1', title: 'Visite effectuée', body: 'La visite de 08:00 chez Marie Dupont a été marquée comme effectuée.', type: 'success', read: true, created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  { id: '6', user_id: 'u1', cabinet_id: 'c1', title: 'Nouveau patient ajouté', body: 'Pierre Bernard a été ajouté à la liste des patients.', type: 'success', read: true, link: '/patients/6', created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
]

const typeConfig: Record<Notification['type'], { icon: string; cls: string; dot: string }> = {
  info:    { icon: 'ℹ️', cls: 'bg-blue-50 dark:bg-blue-950/30',    dot: 'bg-blue-500' },
  warning: { icon: '⚠️', cls: 'bg-orange-50 dark:bg-orange-950/30', dot: 'bg-orange-500' },
  error:   { icon: '🔴', cls: 'bg-red-50 dark:bg-red-950/30',       dot: 'bg-red-500' },
  success: { icon: '✅', cls: 'bg-green-50 dark:bg-green-950/30',   dot: 'bg-green-500' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Il y a ${hrs}h`
  return `Il y a ${Math.floor(hrs / 24)} jour${Math.floor(hrs / 24) > 1 ? 's' : ''}`
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleClick = (notif: Notification) => {
    markRead(notif.id)
    if (notif.link) navigate(notif.link)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout lu'}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              Tout marquer lu
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium transition-colors dark:border-gray-700',
              filter === f
                ? 'bg-navy-800 text-white dark:bg-navy-600'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            {f === 'all' ? 'Toutes' : 'Non lues'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          description="Vous êtes à jour !"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const tc = typeConfig[notif.type]
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={clsx(
                  'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm',
                  notif.read
                    ? 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
                    : clsx('border-gray-200 dark:border-gray-700', tc.cls)
                )}
              >
                <div className="relative mt-0.5 shrink-0 text-xl leading-none">{tc.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx('text-sm font-medium', notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white')}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', tc.dot)} />}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{notif.body}</p>
                  <p className="mt-1 text-xs text-gray-400">{timeAgo(notif.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
