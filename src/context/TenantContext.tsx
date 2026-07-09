import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Consultorio } from '../types/database'

interface TenantCtx { tenant: Consultorio | null; loading: boolean }
const TenantContext = createContext<TenantCtx>({ tenant: null, loading: true })

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tenant, setTenant] = useState<Consultorio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setTenant(null); setLoading(false); return }
    ;(async () => {
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('consultorio_id, consultorios:consultorio_id(id, nombre, slug, plan, activo, created_at, updated_at)')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        setTenant((data as any).consultorios)
      }
      setLoading(false)
    })()
  }, [user])

  return <TenantContext.Provider value={{ tenant, loading }}>{children}</TenantContext.Provider>
}

export const useTenant = () => useContext(TenantContext)