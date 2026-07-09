import { Clock, User, StickyNote, CheckSquare } from 'lucide-react'
import { formatTime } from '../../utils/formatters'
import type { Cita } from '../../types/database'

interface Props {
  appointment: Cita & { 
    beneficiario?: { nombre_completo: string; codigo_expediente: string }
    notas_internas?: string
    tarea_pendiente?: boolean
    tarea_pendiente_texto?: string
    tarea_completada?: boolean
  }
  onClick: () => void
}

const estadoColors: Record<string, string> = {
  agendada:    'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  completada:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  cancelada:   'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  reagendada:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  no_asistio:  'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300',
}

export function AppointmentCard({ appointment, onClick }: Props) {
  const tieneNotas = !!appointment.notas_internas
  const tieneTarea = !!appointment.tarea_pendiente
  const tareaCompletada = !!appointment.tarea_completada

  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-card active:scale-[0.98] transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary-700 dark:text-primary-300">
          <Clock className="w-4 h-4" />
          {formatTime(appointment.hora_inicio)} - {formatTime(appointment.hora_fin)}
        </div>
        <div className="flex items-center gap-1">
          {tieneTarea && (
            <span className={'p-1 rounded ' + (tareaCompletada ? 'text-emerald-500' : 'text-amber-500')}>
              <CheckSquare className="w-3.5 h-3.5" />
            </span>
          )}
          {tieneNotas && (
            <span className="p-1 rounded text-purple-500">
              <StickyNote className="w-3.5 h-3.5" />
            </span>
          )}
          <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + estadoColors[appointment.estado]}>
            {appointment.estado}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-slate-400" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">{appointment.beneficiario?.nombre_completo || '-'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Exp. {appointment.beneficiario?.codigo_expediente} - {appointment.modalidad}</p>
        </div>
      </div>
      {tieneTarea && !tareaCompletada && appointment.tarea_pendiente_texto && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
          <CheckSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{appointment.tarea_pendiente_texto}</span>
        </div>
      )}
    </button>
  )
}