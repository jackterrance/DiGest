import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { NotificationBanner } from './NotificationBanner'
import { TopBar } from './TopBar'

const titles: Record<string, { title: string; subtitle?: string }> = {
  '/calendario':    { title: 'Agenda',       subtitle: 'Citas y pagos' },
  '/beneficiarios': { title: 'Pacientes',    subtitle: 'Expedientes clínicos' },
  '/inventario':    { title: 'Inventario',   subtitle: 'Suministros del consultorio' },
  '/reportes':      { title: 'Reportes',     subtitle: 'Métricas e ingresos' }, // <- Agregado para Reportes
  '/configuracion': { title: 'Ajustes' },
}

export function MobileShell() {
  const { pathname } = useLocation()
  const t = titles[pathname] || { title: 'PsiGest' }
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 max-w-md mx-auto shadow-soft">
      <TopBar title={t.title} subtitle={t.subtitle} />
      <main className="flex-1 overflow-y-auto pb-20"><Outlet /></main>
      <BottomNav />
    </div>
  )
}