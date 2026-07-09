import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'
import type { Beneficiario } from '../types/database'

export interface BeneficiarioConConteo extends Beneficiario {
  total_citas?: number
}

export function useBeneficiaries(search = '', filtroEstado: 'todos' | 'activo' | 'inactivo' = 'todos') {
  const { tenant } = useTenant()
  const [items, setItems] = useState<BeneficiarioConConteo[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ activos: 0, inactivos: 0, total: 0 })

  useEffect(() => {
    if (!tenant) return
    setLoading(true)
    let q = supabase
      .from('beneficiarios_expedientes')
      .select('*, citas:citas(count)')
      .eq('consultorio_id', tenant.id)
      .order('nombre_completo')
      .limit(100)
    
    if (filtroEstado !== 'todos') q = q.eq('estado', filtroEstado)
    if (search) q = q.ilike('nombre_completo', '%' + search + '%')
    
    q.then(async ({ data }) => {
      const itemsConConteo = (data || []).map((b: any) => ({
        ...b,
        total_citas: b.citas?.[0]?.count || 0
      }))
      setItems(itemsConConteo)
      setLoading(false)
    })
    
    // Stats
    supabase.from('beneficiarios_expedientes').select('estado', { count: 'exact' })
      .eq('consultorio_id', tenant.id)
      .then(({ data, count }) => {
        const activos = (data || []).filter((d: any) => d.estado === 'activo').length
        setStats({ activos, inactivos: (count || 0) - activos, total: count || 0 })
      })
  }, [tenant, search, filtroEstado])

  return { items, loading, stats }
}