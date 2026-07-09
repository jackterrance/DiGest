import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter, Clock, Eye, ListFilter } from 'lucide-react'
import { AppointmentModal } from '../components/calendar/AppointmentModal'

interface Cita {
  id: string
  beneficiario_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  tipo_sesion: string
  modalidad: string
  notas?: string
}

interface Beneficiario {
  id: string
  nombre_completo: string
  codigo_expediente: string
}

export default function CalendarPage() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [citas, setCitas] = useState<Cita[]>([])
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [selectedDayDetail, setSelectedDayDetail] = useState<Date | null>(null)
  
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    beneficiario_id: '',
    fecha: '',
    hora_inicio: '09:00',
    hora_fin: '10:00',
    tipo_sesion: 'individual',
    modalidad: 'presencial',
    notas: '',
  })

  useEffect(() => {
    if (tenant) {
      loadCitas()
      loadBeneficiarios()
    }
  }, [tenant, currentDate, filterEstado])

  const loadCitas = async () => {
    if (!tenant) return
    
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const inicioMes = `${year}-${month}-01`
    const finMes = `${year}-${month}-${new Date(year, currentDate.getMonth() + 1, 0).getDate()}`

    let query = (supabase.from('citas') as any)
      .select('id, beneficiario_id, fecha, hora_inicio, hora_fin, estado, tipo_sesion, modalidad, notas')
      .eq('consultorio_id', tenant.id)
      .gte('fecha', inicioMes)
      .lte('fecha', finMes)

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado)
    }

    const { data, error } = await query
    if (!error && data) setCitas(data)
  }

  const loadBeneficiarios = async () => {
    if (!tenant) return
    const { data, error } = await (supabase.from('beneficiarios_expedientes') as any)
      .select('id, nombre_completo, codigo_expediente')
      .eq('consultorio_id', tenant.id)
      .eq('estado', 'activo')
    if (!error && data) setBeneficiarios(data)
  }

  const handleSaveCita = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant || !form.beneficiario_id || !form.fecha || !form.hora_inicio || !form.hora_fin) return

    setLoading(true)

    const { error } = await (supabase.from('citas') as any).insert({
      consultorio_id: tenant.id,
      beneficiario_id: form.beneficiario_id,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      tipo_sesion: form.tipo_sesion,
      modalidad: form.modalidad,
      estado: 'agendada',
      notas: form.notas || null,
      created_by: user?.id || null,
    })

    setLoading(false)
    if (error) {
      alert('Error al agendar: ' + error.message)
    } else {
      setShowAddModal(false)
      setForm({ 
        beneficiario_id: '', 
        fecha: '', 
        hora_inicio: '09:00', 
        hora_fin: '10:00', 
        tipo_sesion: 'individual', 
        modalidad: 'presencial', 
        notas: '' 
      })
      loadCitas()
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDayIndex; i++) { days.push(null) }
    for (let i = 1; i <= totalDays; i++) { days.push(new Date(year, month, i)) }
    return days
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  // Helpers para conteo y filtros de resúmenes
  const totalCitasMes = citas.length
  const completadasMes = citas.filter(c => c.estado === 'completada').length

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  // Formatear fecha Date a string YYYY-MM-DD
  const formatLocalDate = (date: Date) => {
    const offset = date.getTimezoneOffset()
    const targetDate = new Date(date.getTime() - (offset * 60 * 1000))
    return targetDate.toISOString().split('T')[0]
  }

  // Citas correspondientes al día seleccionado en detalle
  const citasDelDiaSeleccionado = selectedDayDetail 
    ? citas.filter(c => c.fecha === formatLocalDate(selectedDayDetail))
    : []

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 w-full overflow-x-hidden暗">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Agenda de Citas</h1>
            <p className="text-sm text-slate-500">Administra el flujo de pacientes y horarios</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Controles de Navegación de Fecha */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition text-slate-600 dark:text-slate-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[110px] text-center">
              {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition text-slate-600 dark:text-slate-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-slate-600 dark:text-slate-200 focus:outline-none cursor-pointer">
              <option value="todos">Todos los estados</option>
              <option value="agendada">Agendadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {/* Botón Nueva Cita */}
          <button onClick={() => {
            setForm({ ...form, fecha: formatLocalDate(new Date()) })
            setShowAddModal(true)
          }} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Nueva Cita
          </button>
        </div>
      </div>

      {/* REQUERIMIENTO: Resumen Métrico de Agenda por Mes/Semana */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total del Mes</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalCitasMes} turnos</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Completadas</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{completadasMes} citas</p>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            💡 <span className="font-medium">Tip móvil:</span> Toca cualquier día para abrir el resumen de horas programadas.
          </p>
        </div>
      </div>

      {/* Calendario Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center py-3 font-semibold text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
          {diasSemana.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 auto-rows-[85px] sm:auto-rows-[120px] divide-x divide-y divide-slate-100 dark:divide-slate-800 border-l border-t border-transparent">
          {getDaysInMonth().map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="bg-slate-50/30 dark:bg-slate-950/10" />

            const dayCitas = citas.filter(c => {
              const [cYear, cMonth, cDay] = c.fecha.split('-').map(Number)
              return cDay === day.getDate() && (cMonth - 1) === day.getMonth() && cYear === day.getFullYear()
            })

            return (
              // REQUERIMIENTO: Al hacer clic en el día, abre ventana detallada
              <div 
                key={day.toString()} 
                onClick={() => setSelectedDayDetail(day)}
                className="p-1.5 sm:p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col space-y-1 overflow-hidden cursor-pointer relative group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition">{day.getDate()}</span>
                  {dayCitas.length > 0 && (
                    <span className="sm:hidden text-[9px] bg-blue-600 text-white font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {dayCitas.length}
                    </span>
                  )}
                </div>
                
                {/* Vista interna reducida para pantallas grandes */}
                <div className="hidden sm:flex flex-col space-y-1 overflow-y-auto scrollbar-none h-full pb-2">
                  {dayCitas.slice(0, 3).map(cita => {
                    const paciente = beneficiarios.find(b => b.id === cita.beneficiario_id)
                    const nombrePaciente = paciente ? paciente.nombre_completo : 'Paciente'
                    const horaFormateada = cita.hora_inicio.substring(0, 5)

                    return (
                      <div key={cita.id} className={`text-[10px] p-1 rounded border truncate leading-tight ${
                        cita.estado === 'completada' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300' :
                        cita.estado === 'cancelada' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300' :
                        'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300'
                      }`}>
                        <span className="font-semibold block truncate">{horaFormateada} - {nombrePaciente}</span>
                      </div>
                    )
                  })}
                  {dayCitas.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-medium text-center block">+ {dayCitas.length - 3} más</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* REQUERIMIENTO: Modal con ventana detallada de citas para el día seleccionado */}
      {selectedDayDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Citas del {selectedDayDetail.getDate()} de {meses[selectedDayDetail.getMonth()]}
                </h3>
                <p className="text-xs text-slate-400">Distribución horaria para hoy</p>
              </div>
              <button 
                onClick={() => {
                  setForm({ ...form, fecha: formatLocalDate(selectedDayDetail) })
                  setShowAddModal(true)
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar turno
              </button>
            </div>

            <div className="space-y-2.5 my-2">
              {citasDelDiaSeleccionado.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm text-slate-400">No hay ninguna consulta agendada en esta fecha.</p>
                </div>
              ) : (
                citasDelDiaSeleccionado
                  .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                  .map(cita => {
                    const paciente = beneficiarios.find(b => b.id === cita.beneficiario_id)
                    return (
                      <div 
                        key={cita.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAppointmentId(cita.id)
                        }}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-2 hover:scale-[1.01] cursor-pointer transition ${
                          cita.estado === 'completada' ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40' :
                          cita.estado === 'cancelada' ? 'bg-rose-50/60 border-rose-100 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900/40' :
                          'bg-blue-50/60 border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/40'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cita.hora_inicio.substring(0, 5)} - {cita.hora_fin.substring(0, 5)}</span>
                          </div>
                          <p className="text-sm font-semibold truncate dark:text-slate-100">
                            {paciente ? paciente.nombre_completo : 'Paciente'}
                          </p>
                          <p className="text-[11px] opacity-75 capitalize">
                            {cita.modalidad} · {cita.tipo_sesion}
                          </p>
                        </div>
                        <span className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400 hover:text-blue-500">
                          <Eye className="w-4 h-4" />
                        </span>
                      </div>
                    )
                  })
              )}
            </div>

            <button 
              onClick={() => setSelectedDayDetail(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              Cerrar Vista Diaria
            </button>
          </div>
        </div>
      )}

      {/* Modal Nativo de Creación Rápida */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Agendar Cita Médica</h3>
            <form onSubmit={handleSaveCita} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Paciente / Expediente *</label>
                <select required value={form.beneficiario_id} onChange={e => setForm({...form, beneficiario_id: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Selecciona un paciente</option>
                  {beneficiarios.map(b => (
                    <option key={b.id} value={b.id}>[{b.codigo_expediente}] {b.nombre_completo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Fecha *</label>
                <input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Hora Inicio *</label>
                  <input type="time" required value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Hora Fin *</label>
                  <input type="time" required value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Tipo de Sesión *</label>
                  <select value={form.tipo_sesion} onChange={e => setForm({...form, tipo_sesion: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="individual">Individual</option>
                    <option value="grupal">Grupal</option>
                    <option value="familiar">Familiar</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Modalidad *</label>
                  <select value={form.modalidad} onChange={e => setForm({...form, modalidad: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="presencial">Presencial</option>
                    <option value="online">En Línea</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Notas / Motivo</label>
                <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} rows={2}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Notas sobre la sesión..." />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Componente Modular Reutilizable para Detalles/Edición Completa */}
      {selectedAppointmentId && (
        <AppointmentModal 
          appointmentId={selectedAppointmentId} 
          onClose={() => {
            setSelectedAppointmentId(null)
            loadCitas() // Recargar para sincronizar cambios
          }} 
        />
      )}

    </div>
  )
}