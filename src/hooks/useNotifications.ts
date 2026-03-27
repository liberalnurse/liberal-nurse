// Hook notifications : fetch + abonnement realtime Supabase
import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notification } from '@/types'

export function useNotifications() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, loading, setNotifications, addNotification, markAsRead, markAllAsRead, setLoading } =
    useNotificationStore()

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications((data as Notification[]) ?? [])
    } catch {
      // Silencieux : les notifications ne bloquent pas l'app
    } finally {
      setLoading(false)
    }
  }, [user?.id, setNotifications, setLoading])

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      markAsRead(id)
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    },
    [markAsRead]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    if (!user?.id) return
    markAllAsRead()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }, [user?.id, markAllAsRead])

  // Abonnement realtime pour les nouvelles notifications
  useEffect(() => {
    if (!user?.id) return

    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          addNotification(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  }
}
