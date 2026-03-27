import { useState, useEffect, KeyboardEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import { usePatients } from '@/hooks/usePatients'
import { useUIStore } from '@/store/uiStore'
import type { Patient } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'

// ─── Schéma Zod ───────────────────────────────────────────────────────────────

const patientSchema = z.object({
  last_name: z.string().min(1, 'Le nom est requis'),
  first_name: z.string().min(1, 'Le prénom est requis'),
  birth_date: z.string().optional(),
  gender: z.enum(['M', 'F', 'autre']).optional(),
  nir: z.string().optional(),
  phone: z.string().optional(),
  phone_emergency: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  medecin_traitant: z.string().optional(),
  medecin_prescripteur: z.string().optional(),
  notes: z.string().optional(),
  mutuelle: z.string().optional(),
  mutuelle_num: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientSchema>

// ─── Composant TagsInput ──────────────────────────────────────────────────────

interface TagsInputProps {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

function TagsInput({ label, value, onChange, placeholder }: TagsInputProps) {
  const [inputVal, setInputVal] = useState('')

  const addTag = () => {
    const tag = inputVal.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInputVal('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && inputVal === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="w-full space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div
        className={clsx(
          'flex min-h-[2.75rem] flex-wrap gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2',
          'focus-within:border-navy-600 focus-within:ring-2 focus-within:ring-navy-100',
          'dark:border-gray-600 dark:bg-gray-800 dark:focus-within:border-navy-400 dark:focus-within:ring-navy-900'
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-medium text-navy-800 dark:bg-navy-900 dark:text-navy-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-navy-500 hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200"
              aria-label={`Supprimer ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? (placeholder ?? 'Ajouter…') : ''}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Appuyez sur Entrée ou virgule pour ajouter</p>
    </div>
  )
}

// ─── Section de formulaire ────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {title}
        </h2>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PatientFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const { getPatient, createPatient, updatePatient } = usePatients()

  const isEdit = Boolean(id && id !== 'nouveau')
  const [loadingPatient, setLoadingPatient] = useState(isEdit)
  const [pathologies, setPathologies] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      last_name: '',
      first_name: '',
    },
  })

  // Chargement du patient en mode édition
  useEffect(() => {
    if (!isEdit || !id) return

    const load = async () => {
      setLoadingPatient(true)
      const patient = await getPatient(id)
      if (patient) {
        reset({
          last_name: patient.last_name,
          first_name: patient.first_name,
          birth_date: patient.birth_date ?? '',
          gender: patient.gender,
          nir: patient.nir ?? '',
          phone: patient.phone ?? '',
          phone_emergency: patient.phone_emergency ?? '',
          emergency_contact_name: patient.emergency_contact_name ?? '',
          address: patient.address ?? '',
          city: patient.city ?? '',
          postal_code: patient.postal_code ?? '',
          medecin_traitant: patient.medecin_traitant ?? '',
          medecin_prescripteur: patient.medecin_prescripteur ?? '',
          notes: patient.notes ?? '',
          mutuelle: patient.mutuelle ?? '',
          mutuelle_num: patient.mutuelle_num ?? '',
        })
        setPathologies(patient.pathologies ?? [])
        setAllergies(patient.allergies ?? [])
      }
      setLoadingPatient(false)
    }

    load()
  }, [id, isEdit, getPatient, reset])

  const onSubmit = async (values: PatientFormValues) => {
    setSubmitting(true)
    try {
      const payload: Partial<Patient> = {
        ...values,
        gender: values.gender ?? undefined,
        pathologies,
        allergies,
        active: true,
      }

      let result: Patient | null = null

      if (isEdit && id) {
        result = await updatePatient(id, payload)
      } else {
        result = await createPatient(payload)
      }

      if (result) {
        navigate(`/patients/${result.id}`)
      }
    } catch {
      addToast('Une erreur est survenue lors de la sauvegarde.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingPatient) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" label="Chargement du patient..." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
      <PageHeader
        title={isEdit ? 'Modifier le patient' : 'Nouveau patient'}
        breadcrumb={[
          { label: 'Patients', href: '/patients' },
          { label: isEdit ? 'Modification' : 'Nouveau patient' },
        ]}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← Annuler
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* ── Identité ── */}
        <FormSection title="Identité">
          <Input
            label="Nom"
            required
            placeholder="Dupont"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
          <Input
            label="Prénom"
            required
            placeholder="Marie"
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Date de naissance"
            type="date"
            error={errors.birth_date?.message}
            {...register('birth_date')}
          />
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select
                label="Genre"
                placeholder="Sélectionner"
                options={[
                  { value: 'M', label: 'Homme' },
                  { value: 'F', label: 'Femme' },
                  { value: 'autre', label: 'Autre' },
                ]}
                error={errors.gender?.message}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
          <Input
            label="N° Sécurité sociale (NIR)"
            placeholder="2 45 03 75 011 234"
            error={errors.nir?.message}
            {...register('nir')}
          />
        </FormSection>

        {/* ── Contact ── */}
        <FormSection title="Contact">
          <Input
            label="Téléphone"
            type="tel"
            placeholder="06 12 34 56 78"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Téléphone urgence"
            type="tel"
            placeholder="01 23 45 67 89"
            error={errors.phone_emergency?.message}
            {...register('phone_emergency')}
          />
          <Input
            label="Nom contact urgence"
            placeholder="Jean Dupont"
            error={errors.emergency_contact_name?.message}
            {...register('emergency_contact_name')}
          />
          <div className="sm:col-span-2">
            <Input
              label="Adresse"
              placeholder="12 rue des Lilas"
              error={errors.address?.message}
              {...register('address')}
            />
          </div>
          <Input
            label="Code postal"
            placeholder="75011"
            error={errors.postal_code?.message}
            {...register('postal_code')}
          />
          <Input
            label="Ville"
            placeholder="Paris"
            error={errors.city?.message}
            {...register('city')}
          />
        </FormSection>

        {/* ── Médical ── */}
        <FormSection title="Médical">
          <Input
            label="Médecin traitant"
            placeholder="Dr. Martin"
            error={errors.medecin_traitant?.message}
            {...register('medecin_traitant')}
          />
          <Input
            label="Médecin prescripteur"
            placeholder="Dr. Durand"
            error={errors.medecin_prescripteur?.message}
            {...register('medecin_prescripteur')}
          />
          <div className="sm:col-span-2">
            <TagsInput
              label="Pathologies"
              value={pathologies}
              onChange={setPathologies}
              placeholder="Diabète, hypertension…"
            />
          </div>
          <div className="sm:col-span-2">
            <TagsInput
              label="Allergies"
              value={allergies}
              onChange={setAllergies}
              placeholder="Pénicilline, latex…"
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Notes"
              placeholder="Observations particulières…"
              rows={3}
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>
        </FormSection>

        {/* ── Admin ── */}
        <FormSection title="Administratif">
          <Input
            label="Mutuelle"
            placeholder="MGEN"
            error={errors.mutuelle?.message}
            {...register('mutuelle')}
          />
          <Input
            label="N° mutuelle"
            placeholder="123456789"
            error={errors.mutuelle_num?.message}
            {...register('mutuelle_num')}
          />
        </FormSection>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Enregistrer les modifications' : 'Créer le patient'}
          </Button>
        </div>
      </form>
    </div>
  )
}
