import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from './TenantContext'

export interface ConsultorioTheme {
  color_primario: string
  color_secundario: string
  color_acento: string
  logo_url: string | null
  nombre_mostrar: string
}

const defaultTheme: ConsultorioTheme = {
  color_primario: '#234f7c',
  color_secundario: '#3b82c4',
  color_acento: '#2e6aa3',
  logo_url: null,
  nombre_mostrar: 'PsiGest',
}

interface ThemeCtx {
  theme: ConsultorioTheme
  update: (changes: Partial<ConsultorioTheme>) => Promise<void>
  loading: boolean
}

const ThemeContext = createContext<ThemeCtx>({ theme: defaultTheme, update: async () => {}, loading: true })

export function ConsultorioThemeProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant()
  const [theme, setTheme] = useState<ConsultorioTheme>(defaultTheme)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) { setLoading(false); return }
    setTheme({
      color_primario: (tenant as any).color_primario || defaultTheme.color_primario,
      color_secundario: (tenant as any).color_secundario || defaultTheme.color_secundario,
      color_acento: (tenant as any).color_acento || defaultTheme.color_acento,
      logo_url: (tenant as any).logo_url || null,
      nombre_mostrar: tenant.nombre || defaultTheme.nombre_mostrar,
    })
    setLoading(false)
  }, [tenant])

  // Aplicar colores al CSS
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primario', theme.color_primario)
    root.style.setProperty('--color-secundario', theme.color_secundario)
    root.style.setProperty('--color-acento', theme.color_acento)
  }, [theme])

  const update = async (changes: Partial<ConsultorioTheme>) => {
    if (!tenant) return
    const newTheme = { ...theme, ...changes }
    setTheme(newTheme)
    await (supabase.from('consultorios') as any).update(changes).eq('id', tenant.id)
  }

  return <ThemeContext.Provider value={{ theme, update, loading }}>{children}</ThemeContext.Provider>
}

export const useConsultorioTheme = () => useContext(ThemeContext)