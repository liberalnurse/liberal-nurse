// Store notifications avec persistance Zustand
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setLoading: (loading: boolean) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.read).length
        set({ notifications, unreadCount })
      },

      addNotification: (notification) => {
        set((state) => {
          // Évite les doublons
          if (state.notifications.find((n) => n.id === notification.id)) {
            return state
          }
          const notifications = [notification, ...state.notifications]
          const unreadCount = notifications.filter((n) => !n.read).length
          return { notifications, unreadCount }
        })
      },

      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
          const unreadCount = notifications.filter((n) => !n.read).length
          return { notifications, unreadCount }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'liberal-nurse-notifications',
      // On ne persiste que les notifications non lues pour éviter les données obsolètes
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50),
        unreadCount: state.unreadCount,
      }),
    }
  )
)

// Sélecteur utilitaire
export const selectUnreadCount = (state: NotificationState) => state.unreadCount
