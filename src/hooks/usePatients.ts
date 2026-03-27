// Hook pour la gestion des patients : fetch, recherche, pagination, CRUD
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import type { Patient } from '@/types'

const PAGE_SIZE = 20

interface UsePatients {
  patients: Patient[]
  loading: boolean
  error: string | null
  total: number
  page: number
  fetchPatients: (options?: FetchOptions) => Promise<void>
  getPatient: (id: string) => Promise<Patient | null>
  createPatient: (data: Partial<Patient>) => Promise<Patient | null>
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient | null>
  deletePatient: (id: string) => Promise<boolean>
  setPage: (page: number) => void
}

interface FetchOptions {
  search?: string
  active?: boolean
  page?: number
}

export function usePatients(): UsePatients {
  const { cabinet } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const fetchPatients = useCallback(
    async (options: FetchOptions = {}) => {
      if (!cabinet?.id) return
      setLoading(true)
      setError(null)
      const currentPage = options.page ?? page

      try {
        let query = supabase
          .from('patients')
          .select('*', { count: 'exact' })
          .eq('cabinet_id', cabinet.id)
          .order('last_name', { ascending: true })
          .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

        if (options.active !== undefined) {
          query = query.eq('active', options.active)
        }
        if (options.search && options.search.trim() !== '') {
          const term = `%${options.search.trim()}%`
          query = query.or(
            `last_name.ilike.${term},first_name.ilike.${term},phone.ilike.${term}`
          )
        }

        const { data, error: err, count } = await query
        if (err) throw err
        setPatients((data as Patient[]) ?? [])
        setTotal(count ?? 0)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des patients'
        setError(msg)
        addToast(msg, 'error')
      } finally {
        setLoading(false)
      }
    },
    [cabinet?.id, page, addToast]
  )

  const getPatient = useCallback(
    async (id: string): Promise<Patient | null> => {
      try {
        const { data, error: err } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single()
        if (err) throw err
        return data as Patient
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Patient introuvable'
        addToast(msg, 'error')
        return null
      }
    },
    [addToast]
  )

  const createPatient = useCallback(
    async (data: Partial<Patient>): Promise<Patient | null> => {
      if (!cabinet?.id) return null
      try {
        const { data: created, error: err } = await supabase
          .from('patients')
          .insert({ ...data, cabinet_id: cabinet.id })
          .select()
          .single()
        if (err) throw err
        addToast('Patient créé avec succès', 'success')
        return created as Patient
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la création'
        addToast(msg, 'error')
        return null
      }
    },
    [cabinet?.id, addToast]
  )

  const updatePatient = useCallback(
    async (id: string, data: Partial<Patient>): Promise<Patient | null> => {
      try {
        const { data: updated, error: err } = await supabase
          .from('patients')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()
        if (err) throw err
        addToast('Patient mis à jour', 'success')
        return updated as Patient
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
        addToast(msg, 'error')
        return null
      }
    },
    [addToast]
  )

  const deletePatient = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: err } = await supabase
          .from('patients')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (err) throw err
        addToast('Patient archivé', 'success')
        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        addToast(msg, 'error')
        return false
      }
    },
    [addToast]
  )

  return {
    patients,
    loading,
    error,
    total,
    page,
    fetchPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    setPage,
  }
}
