// Hook planning : fetch visites par période, CRUD
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import type { Visit } from '@/types'

interface UsePlanning {
  visits: Visit[]
  loading: boolean
  error: string | null
  fetchVisits: (dateDebut: string, dateFin: string, nurseId?: string) => Promise<void>
  createVisit: (data: Partial<Visit>) => Promise<Visit | null>
  updateVisit: (id: string, data: Partial<Visit>) => Promise<Visit | null>
  deleteVisit: (id: string) => Promise<boolean>
}

export function usePlanning(): UsePlanning {
  const { cabinet } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVisits = useCallback(
    async (dateDebut: string, dateFin: string, nurseId?: string) => {
      if (!cabinet?.id) return
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('visits')
          .select('*')
          .eq('cabinet_id', cabinet.id)
          .gte('date', dateDebut)
          .lte('date', dateFin)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (nurseId) {
          query = query.eq('nurse_id', nurseId)
        }

        const { data, error: err } = await query
        if (err) throw err
        setVisits((data as Visit[]) ?? [])
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors du chargement du planning'
        setError(msg)
        addToast(msg, 'error')
      } finally {
        setLoading(false)
      }
    },
    [cabinet?.id, addToast]
  )

  const createVisit = useCallback(
    async (data: Partial<Visit>): Promise<Visit | null> => {
      if (!cabinet?.id) return null
      try {
        const { data: created, error: err } = await supabase
          .from('visits')
          .insert({ ...data, cabinet_id: cabinet.id })
          .select()
          .single()
        if (err) throw err
        addToast('Visite planifiée avec succès', 'success')
        setVisits((prev) => [...prev, created as Visit])
        return created as Visit
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la création de la visite'
        addToast(msg, 'error')
        return null
      }
    },
    [cabinet?.id, addToast]
  )

  const updateVisit = useCallback(
    async (id: string, data: Partial<Visit>): Promise<Visit | null> => {
      try {
        const { data: updated, error: err } = await supabase
          .from('visits')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()
        if (err) throw err
        setVisits((prev) =>
          prev.map((v) => (v.id === id ? (updated as Visit) : v))
        )
        addToast('Visite mise à jour', 'success')
        return updated as Visit
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
        addToast(msg, 'error')
        return null
      }
    },
    [addToast]
  )

  const deleteVisit = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: err } = await supabase.from('visits').delete().eq('id', id)
        if (err) throw err
        setVisits((prev) => prev.filter((v) => v.id !== id))
        addToast('Visite supprimée', 'success')
        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        addToast(msg, 'error')
        return false
      }
    },
    [addToast]
  )

  return { visits, loading, error, fetchVisits, createVisit, updateVisit, deleteVisit }
}
