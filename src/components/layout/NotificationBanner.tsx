import { Bell, BellOff, X, Clock, User } from 'lucide-react'
import { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { formatTime } from '../../utils/formatters'

export function NotificationBanner() {
  const { enabled, permission, toggle, citasHoy } = useNotifications()
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  if (dismissed) return null
  if (permission === 'denied') return null
  if (citasHoy.length === 0) return null

  const proximaCita = citasHoy.find(c => {
    if (c.estado !== 'agendada') return false
    const [h, m] = c.hora_inicio.split(':').map(Number)
    const hora = new Date()
    hora.setHours(h, m, 0, 0)
    return hora.getTime() > Date.now() - 30 * 60 * 1000 // Mostrar incluso las que pasaron hace 30 min
  })

  return (
    <div className="mx-3 mt-3 mb-2">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-3 text-white shadow-soft relative">
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-2 mb-1.5 pr-6">
          <Bell className="w-4 h-4" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
            {citasHoy.length} cita{citasHoy.length !== 1 ? 's' : ''} hoy
          </p>
        </div>
        {proximaCita && (
          <div className="flex items-center gap-2 text-sm mb-2">
            <Clock className="w-3.5 h-3.5 opacity-80" />
            <span className="font-semibold">{formatTime(proximaCita.hora_inicio)}</span>
            <User className="w-3.5 h-3.5 opacity-80 ml-2" />
            <span className="truncate">{proximaCita.beneficiario?.nombre_completo || ''}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => navigate('/calendario')} className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded font-medium">
            Ver agenda
          </button>
          <button onClick={toggle} className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded font-medium flex items-center gap-1">
            {enabled ? <><BellOff className="w-3 h-3" /> Desactivar</> : <><Bell className="w-3 h-3" /> Activar push</>}
          </button>
        </div>
      </div>
    </div>
  )
}