import { Calendar, Users, Package, BarChart3, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/calendario',    icon: Calendar,  label: 'Agenda' },
  { to: '/beneficiarios', icon: Users,     label: 'Pacientes' },
  { to: '/inventario',    icon: Package,   label: 'Stock' },
  { to: '/reportes',      icon: BarChart3, label: 'Reportes' }, // <- Añadido Reportes
  { to: '/configuracion', icon: Settings,  label: 'Ajustes' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Cambiado a grid-cols-5 para acomodar los 5 botones */}
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `flex flex-col items-center py-2.5 text-xs transition ${isActive ? 'text-primary-600' : 'text-slate-500'}`}>
            <Icon className="w-5 h-5 mb-1" />{label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}