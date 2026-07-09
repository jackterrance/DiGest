import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useAppointments } from '../../hooks/useAppointments'
import { AppointmentCard } from './AppointmentCard'
import { dayjs } from '../../utils/dates'

export function WeekView({ onSelectDate }: { onSelectDate: (date: string) => void }) {
  const [weekStart, setWeekStart] = useState(dayjs().startOf('week'))
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
  const { appointments, diasConCitas } = useAppointments()
  const byDay = days.map(day => ({
    day,
    items: appointments.filter(a => a.fecha === day.format('YYYY-MM-DD'))
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <button onClick={() => setWeekStart(weekStart.subtract(7, 'day'))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Semana</p>
          <p className="text-sm font-semibold dark:text-slate-100">{weekStart.format('DD MMM')} - {weekStart.add(6, 'day').format('DD MMM')}</p>
        </div>
        <button onClick={() => setWeekStart(weekStart.add(7, 'day'))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {byDay.map(({ day, items }) => {
          const dateStr = day.format('YYYY-MM-DD')
          const hasCitas = diasConCitas.has(dateStr) || items.length > 0
          const isToday = day.isSame(dayjs(), 'day')
          return (
            <div key={dateStr} className={'rounded-xl p-2 border ' + (
              hasCitas ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'border-transparent'
            )}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{day.format('dddd')}</p>
                    <p className="text-sm font-semibold capitalize dark:text-slate-100">{day.format('DD MMM')}</p>
                  </div>
                  {isToday && <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-300 bg-primary-100 dark:bg-primary-800/50 px-2 py-0.5 rounded-full">Hoy</span>}
                </div>
                {items.length > 0 && (
                  <span className="text-xs bg-primary-100 dark:bg-primary-800/50 text-primary-700 dark:text-primary-200 px-2 py-0.5 rounded-full font-medium">
                    {items.length}
                  </span>
                )}
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-slate-400 px-1 py-2">{hasCitas ? 'Cargando...' : 'Sin citas'}</p>
              ) : (
                <div className="space-y-2">
                  {items.map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} onClick={() => onSelectDate(dateStr)} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}