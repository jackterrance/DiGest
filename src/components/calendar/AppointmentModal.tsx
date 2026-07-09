import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { PaymentSection } from '../payments/PaymentSection'
import { supabase } from '../../lib/supabase'
import { Trash2, RotateCcw, StickyNote, CheckSquare, Square, Save, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { dayjs } from '../../utils/dates'

interface Props { appointmentId: string | null; onClose: () => void }

const empty = {
  beneficiario_id: '',
  fecha: dayjs().format('YYYY-MM-DD'),
  hora_inicio: '09:00',
  hora_fin: '10:00',
  tipo_sesion: 'individual',
  modalidad: 'presencial',
  estado: 'agendada',
  notas: '',
  notas_internas: '',
  tarea_pendiente: false,
  tarea_pendiente_texto: '',
  tarea_completada: false,
}

export function AppointmentModal({ appointmentId, onClose }: Props) {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const isNew = !appointmentId
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)
  const [beneficiarios, setBeneficiarios] = useState<any[]>([])
  const [citasDelDia, setCitasDelDia] = useState<any[]>([])

  // Cargar pacientes activos
  useEffect(() => {
    if (!tenant) return;
    (supabase.from('beneficiarios_expedientes') as any)
      .select('id, nombre_completo, codigo_expediente')
      .eq('estado', 'activo')
      .eq('consultorio_id', tenant.id) // Mantener aislamiento estricto
      .order('nombre_completo')
      .then(({ data }: any) => setBeneficiarios(data || []))
  }, [tenant])

  // Cargar datos de la cita si es edición
  useEffect(() => {
    if (!appointmentId) { setForm(empty); return }
    (supabase.from('citas') as any).select('*').eq('id', appointmentId).single()
      .then(({ data }: any) => data && setForm({ ...empty, ...data }))
  }, [appointmentId])

  // EFECTO NUEVO: Monitorear las citas existentes del día elegido para validar colisiones de horario
  useEffect(() => {
    if (!tenant || !form.fecha) return

    (supabase.from('citas') as any)
      .select('id, hora_inicio, hora_fin, estado')
      .eq('consultorio_id', tenant.id)
      .eq('fecha', form.fecha)
      .neq('estado', 'cancelada') // No contar las citas canceladas como bloqueo
      .then(({ data }: any) => {
        // Guardar las citas del día, excluyendo la cita actual si estamos editando
        const filtradas = (data || []).filter((c: any) => c.id !== appointmentId)
        setCitasDelDia(filtradas)
      })
  }, [form.fecha, tenant, appointmentId])

  // Función auxiliar para detectar si la hora seleccionada colisiona con otra cita
  const verificarColisionHorario = () => {
    const inicioNuevo = form.hora_inicio
    const finNuevo = form.hora_fin

    return citasDelDia.some((cita: any) => {
      // Comprobar si los rangos de tiempo se superponen
      const solapaInicio = inicioNuevo >= cita.hora_inicio && inicioNuevo < cita.hora_fin
      const solapaFin = finNuevo > cita.hora_inicio && finNuevo <= cita.hora_fin
      const solapaTotal = inicioNuevo <= cita.hora_inicio && finNuevo >= cita.hora_fin
      
      return solapaInicio || solapaFin || solapaTotal
    })
  }

  const handleSave = async () => {
    if (!tenant || !user) return
    if (!form.beneficiario_id) { alert('Selecciona un paciente'); return }
    
    // Validación de disponibilidad de horario
    if (verificarColisionHorario()) {
      alert(`El horario seleccionado (${form.hora_inicio} - ${form.hora_fin}) ya se encuentra ocupado por otra consulta este día. Por favor, selecciona una hora diferente.`)
      return
    }

    setLoading(true)
    const payload = {
      ...form,
      beneficiario_id: form.beneficiario_id,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      tipo_sesion: form.tipo_sesion,
      modalidad: form.modalidad,
      estado: form.estado,
      notas: form.notas || null,
      notas_internas: form.notas_internas || null,
      tarea_pendiente: !!form.tarea_pendiente,
      tarea_pendiente_texto: form.tarea_pendiente_texto || null,
      tarea_completada: !!form.tarea_completada,
      consultorio_id: tenant.id,
      created_by: user.id,
    }
    if (isNew) await (supabase.from('citas') as any).insert(payload)
    else await (supabase.from('citas') as any).update(payload).eq('id', appointmentId)
    setLoading(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!appointmentId) return
    if (!confirm('¿Eliminar esta cita?')) return
    await (supabase.from('citas') as any).delete().eq('id', appointmentId)
    onClose()
  }

  const handleReschedule = () => {
    const newDate = prompt('Nueva fecha (YYYY-MM-DD):', form.fecha)
    if (!newDate) return
    const newTime = prompt('Nueva hora inicio (HH:MM):', form.hora_inicio)
    if (!newTime) return
    setForm({ ...form, fecha: newDate, hora_inicio: newTime, estado: 'reagendada' })
  }

  const toggleTarea = () => {
    setForm({
      ...form,
      tarea_pendiente: !form.tarea_pendiente,
      tarea_completada: !form.tarea_pendiente ? false : form.tarea_completada
    })
  }

  const horarioBloqueado = verificarColisionHorario()

  return (
    <Modal onClose={onClose} title={isNew ? 'Nueva cita' : 'Detalle de cita'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Paciente</label>
          <select value={form.beneficiario_id} onChange={e => setForm({...form, beneficiario_id: e.target.value})}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg">
            <option value="">- Selecciona -</option>
            {beneficiarios.map(b => <option key={b.id} value={b.id}>{b.codigo_expediente} - {b.nombre_completo}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-slate-600">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Inicio</label>
            <input type="time" value={form.hora_inicio} onChange={e => setForm({...form, hora_inicio: e.target.value})}
              className={`w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:text-slate-100 ${horarioBloqueado ? 'border-amber-400 bg-amber-50/50 dark:border-amber-600 text-amber-700' : 'border-slate-200 dark:border-slate-600'}`} />
          </div>
          <div>
            <label className="text-xs text-slate-600">Fin</label>
            <input type="time" value={form.hora_fin} onChange={e => setForm({...form, hora_fin: e.target.value})}
              className={`w-full p-2.5 border rounded-lg dark:bg-slate-800 dark:text-slate-100 ${horarioBloqueado ? 'border-amber-400 bg-amber-50/50 dark:border-amber-600 text-amber-700' : 'border-slate-200 dark:border-slate-600'}`} />
          </div>
        </div>

        {/* Alerta de disponibilidad visual inmediata */}
        {horarioBloqueado && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Este horario coincide con otra cita guardada para este día.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <select value={form.tipo_sesion} onChange={e => setForm({...form, tipo_sesion: e.target.value})}
            className="p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg">
            <option value="individual">Individual</option>
            <option value="pareja">Pareja</option>
            <option value="familiar">Familiar</option>
            <option value="evaluacion">Evaluacion</option>
          </select>
          <select value={form.modalidad} onChange={e => setForm({...form, modalidad: e.target.value})}
            className="p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg">
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </select>
        </div>

        <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}
          className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg">
          <option value="agendada">Agendada</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
          <option value="no_asistio">No asistio</option>
        </select>

        {/* Notas de la sesión */}
        <div>
          <label className="text-xs text-slate-600">Notas de la sesion</label>
          <textarea value={form.notas || ''} onChange={e => setForm({...form, notas: e.target.value})}
            rows={2} placeholder="Notas generales sobre la sesion..."
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
        </div>

        {/* Notas internas */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <StickyNote className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
            <label className="text-xs font-semibold text-purple-700 dark:text-purple-300">NOTAS INTERNAS (privadas)</label>
          </div>
          <textarea value={form.notas_internas || ''} onChange={e => setForm({...form, notas_internas: e.target.value})}
            rows={3} placeholder="Observaciones privadas, hipotesis, plan terapeutico..."
            className="w-full p-2 border border-purple-200 dark:border-purple-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-slate-100" />
          </div>

        {/* Tarea pendiente */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={toggleTarea} className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              {form.tarea_pendiente ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              Marcar tarea pendiente
            </button>
            {form.tarea_pendiente && form.tarea_completada && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">Completada</span>
            )}
          </div>
          {form.tarea_pendiente && (
            <>
              <input value={form.tarea_pendiente_texto || ''} onChange={e => setForm({...form, tarea_pendiente_texto: e.target.value})}
                placeholder="Ej. Llamar al paciente el viernes"
                className="w-full p-2 border border-amber-200 dark:border-amber-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-slate-100" />
              <label className="flex items-center gap-2 mt-2 text-xs text-amber-800 dark:text-amber-300">
                <input type="checkbox" checked={form.tarea_completada} onChange={e => setForm({...form, tarea_completada: e.target.checked})}
                  className="rounded" />
                Ya la complete
              </label>
            </>
          )}
        </div>

        {!isNew && appointmentId && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <PaymentSection citaId={appointmentId} />
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
          {!isNew && (
            <>
              <Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /> Eliminar</Button>
              <Button variant="secondary" onClick={handleReschedule}><RotateCcw className="w-4 h-4" /> Reagendar</Button>
            </>
          )}
          <Button variant="primary" onClick={handleSave} loading={loading} disabled={horarioBloqueado} className="ml-auto">
            <Save className="w-4 h-4" /> {isNew ? 'Crear cita' : 'Guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}