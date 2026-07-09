import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { useState } from 'react'
import { AppointmentCard } from './AppointmentCard'
import { AppointmentModal } from './AppointmentModal'
import { useAppointments } from '../../hooks/useAppointments'
import { dayjs } from '../../utils/dates'
import { Button } from '../ui/Button'

type Filter = 'todas' | 'agendada' | 'completada' | 'cancelada'

export function DayView({ initialDate }: { initialDate?: any } = {}) {
  const [date, setDate] = useState(initialDate || dayjs())
  const [filter, setFilter] = useState<Filter>('todas')
  const [selected, setSelected] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  
  const { appointments, loading } = useAppointments(date.format('YYYY-MM-DD'))
  const filtered = filter === 'todas' ? appointments : appointments.filter(a => a.estado === filter)
  const hasCitas = appointments.length > 0
  const isToday = date.isSame(dayjs(), 'day')

  return (
    <div className="flex flex-col h-full">
      <div className={'flex items-center justify-between p-3 border-b transition ' + (
        hasCitas 
          ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' 
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
      )}>
        <button onClick={() => setDate(date.subtract(1, 'day'))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{date.format('dddd')}</p>
            {hasCitas && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800/50 px-2 py-0.5 rounded-full">
                <Calendar className="w-3 h-3" /> {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
              </span>
            )}
            {isToday && <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-300 bg-primary-100 dark:bg-primary-800/50 px-2 py-0.5 rounded-full">Hoy</span>}
          </div>
          <p className="text-base font-semibold capitalize dark:text-slate-100">{date.format('DD MMM YYYY')}</p>
        </div>
        <button onClick={() => setDate(date.add(1, 'day'))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 p-3 overflow-x-auto bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        {(['todas','agendada','completada','cancelada'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ' + (
              filter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            )}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <p className="text-center text-slate-400 py-8 text-sm">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">Sin citas para este dia</p>
        ) : (
          filtered.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} onClick={() => setSelected(apt.id)} />
          ))
        )}
      </div>

      <div className="fixed bottom-20 right-0 max-w-md mx-auto" style={{ right: 'max(1rem, calc(50vw - 224px))' }}>
        <Button onClick={() => setShowNew(true)} className="rounded-full shadow-soft w-14 h-14 !p-0">
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {selected && <AppointmentModal appointmentId={selected} onClose={() => setSelected(null)} />}
      {showNew  && <AppointmentModal appointmentId={null}     onClose={() => setShowNew(false)} />}
    </div>
  )
}