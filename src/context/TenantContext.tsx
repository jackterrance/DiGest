import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Consultorio } from '../types/database'

interface TenantCtx {
  tenant: Consultorio | null
  loading: boolean
  refreshTenant: () => Promise<void>  // 👈 AGREGADO
}

const TenantContext = createContext<TenantCtx>({
  tenant: null,
  loading: true,
  refreshTenant: async () => {},
})

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tenant, setTenant] = useState<Consultorio | null>(null)
  const [loading, setLoading] = useState(true)

  // 👇 Función para recargar el tenant (la usa SettingsScreen)
  const refreshTenant = useCallback(async () => {
    if (!user) {
      setTenant(null)
      return
    }
    const { data, error } = await supabase
      .from('perfiles_usuarios')
      .select(`
        consultorio_id,
        consultorios:consultorio_id(
          id,
          nombre,
          slug,
          plan,
          activo,
          color_primario,
          color_secundario,
          color_acento,
          logo_url,
          created_at,
          updated_at
        )
      `)
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setTenant((data as any).consultorios)
    }
  }, [user])

  // Carga inicial
  useEffect(() => {
    if (!user) {
      setTenant(null)
      setLoading(false)
      return
    }
    setLoading(true)
    refreshTenant().finally(() => setLoading(false))
  }, [user, refreshTenant])

  return (
    <TenantContext.Provider value={{ tenant, loading, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => useContext(TenantContext)
