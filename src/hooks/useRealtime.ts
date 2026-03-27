// Hook Supabase Realtime pour transmissions et messages
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  onTransmission?: (payload: Record<string, unknown>) => void
  onMessage?: (payload: Record<string, unknown>) => void
  onVisit?: (payload: Record<string, unknown>) => void
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { cabinet, user } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!cabinet?.id || !user?.id) return

    // Abonnement aux changements en temps réel du cabinet
    const channel = supabase
      .channel(`cabinet:${cabinet.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transmissions',
          filter: `cabinet_id=eq.${cabinet.id}`,
        },
        (payload) => {
          options.onTransmission?.(payload.new as Record<string, unknown>)
          const transmission = payload.new as { priority?: string; content?: string }
          if (transmission.priority === 'urgent') {
            addToast('Nouvelle transmission URGENTE reçue', 'error', 6000)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `cabinet_id=eq.${cabinet.id}`,
        },
        (payload) => {
          const msg = payload.new as { recipient_id?: string; sender_id?: string }
          // Notifier uniquement si destinataire est l'utilisateur courant ou broadcast
          if (!msg.recipient_id || msg.recipient_id === user.id) {
            options.onMessage?.(payload.new as Record<string, unknown>)
            if (msg.sender_id !== user.id) {
              addToast('Nouveau message reçu', 'info')
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visits',
          filter: `cabinet_id=eq.${cabinet.id}`,
        },
        (payload) => {
          options.onVisit?.(payload.new as Record<string, unknown>)
        }
      )
      .subscribe()

    channelRef.current = channel

    // Nettoyage à l'unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [cabinet?.id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return { channel: channelRef.current }
}
