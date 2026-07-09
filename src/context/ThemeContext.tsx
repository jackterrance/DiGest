import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeCtx {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeCtx | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('psi-theme') as Theme
    return saved || 'light'
  })

  const [effectiveTheme, setEffective] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const update = () => {
      let eff: 'light' | 'dark' = 'light'
      if (theme === 'dark') eff = 'dark'
      else if (theme === 'auto') {
        eff = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      setEffective(eff)
      if (eff === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
    }
    update()
    localStorage.setItem('psi-theme', theme)
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggle = () => setThemeState(effectiveTheme === 'dark' ? 'light' : 'dark')

  return <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}