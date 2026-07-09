import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { DayView } from '../components/calendar/DayView'
import { WeekView } from '../components/calendar/WeekView'
import { ReportsModal } from '../components/reports/ReportsModal'
import { dayjs } from '../utils/dates'

export function CalendarScreen() {
  const [view, setView] = useState<'day' | 'week'>('day')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showReports, setShowReports] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 bg-white border-b border-slate-100">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button onClick={() => setView('day')}
            className={'px-3 py-1.5 text-xs font-medium rounded-md transition ' + (
              view === 'day' ? 'bg-white text-primary-700 shadow-card' : 'text-slate-600'
            )}>Dia</button>
          <button onClick={() => setView('week')}
            className={'px-3 py-1.5 text-xs font-medium rounded-md transition ' + (
              view === 'week' ? 'bg-white text-primary-700 shadow-card' : 'text-slate-600'
            )}>Semana</button>
        </div>
        <button onClick={() => setShowReports(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded-lg">
          <BarChart3 className="w-4 h-4" /> Reportes
        </button>
      </div>

      {view === 'day' ? (
        <DayView initialDate={selectedDate ? dayjs(selectedDate) : undefined} />
      ) : (
        <WeekView onSelectDate={(d) => { setSelectedDate(d); setView('day') }} />
      )}

      {showReports && <ReportsModal onClose={() => setShowReports(false)} />}
    </div>
  )
}