import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, CheckCircle2, UserPlus, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeBeneficiarios, Beneficiario } from '../../hooks/useRealtimeBeneficiarios';
import { useTenantConfig } from '../../hooks/useTenantConfig';
import {
  generateTimeSlots,
  hasTimeConflict,
  isPastDate,
  isWorkingDay,
  formatLocalDate,
  timeToMinutes,
  minutesToTime,
} from '../../lib/dateUtils';

interface Props {
  initialDate?: string;
  initialBeneficiarioId?: string;
  initialTitulo?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function NuevaCitaModal({
  initialDate,
  initialBeneficiarioId,
  initialTitulo,
  onClose,
  onSaved,
}: Props) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { beneficiarios } = useRealtimeBeneficiarios();
  const { config } = useTenantConfig();

  const [form, setForm] = useState({
    beneficiario_id: initialBeneficiarioId || '',
    fecha: initialDate || formatLocalDate(new Date()),
    hora_inicio: config.hora_apertura,
    hora_fin: minutesToTime(timeToMinutes(config.hora_apertura) + config.duracion_cita_minutos),
    tipo_sesion: 'individual',
    modalidad: 'presencial',
    notas: '',
    titulo: initialTitulo || '',
    es_libre: !!initialTitulo && !initialBeneficiarioId,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citasExistentes, setCitasExistentes] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Cargar citas del día seleccionado para validar conflictos
  useEffect(() => {
    if (!tenant || !form.fecha) return;
    loadCitasDelDia(form.fecha);
  }, [tenant, form.fecha]);

  const loadCitasDelDia = async (fecha: string) => {
    const { data } = await supabase
      .from('citas')
      .select('id, hora_inicio, hora_fin, estado, es_libre, titulo')
      .eq('consultorio_id', tenant!.id)
      .eq('fecha', fecha)
      .neq('estado', 'cancelada');
    setCitasExistentes(data || []);
  };

  // Generar slots disponibles
  const slots = useMemo(() => {
    return generateTimeSlots(config.hora_apertura, config.hora_cierre, config.intervalo_minutos);
  }, [config]);

  // Filtrar slots que no tengan conflicto
  const slotsDisponibles = useMemo(() => {
    return slots.map((slot) => {
      const fin = minutesToTime(timeToMinutes(slot) + config.duracion_cita_minutos);
      const ocupado = hasTimeConflict(slot, fin, citasExistentes);
      return { inicio: slot, fin, ocupado };
    });
  }, [slots, citasExistentes, config.duracion_cita_minutos]);

  // Calcular citas del día y validar saturación
  const citasDelDia = citasExistentes.length;
  const diaSaturado = citasDelDia >= config.max_citas_por_dia;

  // Validar fecha seleccionada
  const fechaObj = new Date(form.fecha + 'T00:00:00');
  const fechaPasada = isPastDate(fechaObj);
  const fechaNoLaboral = !isWorkingDay(fechaObj, config.dias_laborales);

  // Beneficiarios filtrados
  const beneficiariosFiltrados = useMemo(() => {
    if (!search) return beneficiarios.filter((b) => b.estado === 'activo');
    const s = search.toLowerCase();
    return beneficiarios.filter(
      (b) =>
        b.estado === 'activo' &&
        (b.nombre_completo.toLowerCase().includes(s) ||
          b.codigo_expediente.toLowerCase().includes(s))
    );
  }, [beneficiarios, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tenant) return;
    if (fechaPasada) {
      setError('No podés agendar en una fecha pasada');
      return;
    }
    if (fechaNoLaboral) {
      setError('Ese día no es laborable según tu configuración');
      return;
    }
    if (diaSaturado) {
      setError('Este día ya está saturado. Aumentá el límite o elegí otro día.');
      return;
    }
    if (!form.es_libre && !form.beneficiario_id) {
      setError('Seleccioná un paciente o marcá como cita libre');
      return;
    }
    if (form.hora_inicio >= form.hora_fin) {
      setError('La hora de fin debe ser mayor a la de inicio');
      return;
    }

    // Verificar conflicto en tiempo real (por las dudas)
    if (hasTimeConflict(form.hora_inicio, form.hora_fin, citasExistentes)) {
      setError('Ese horario ya está ocupado. Elegí otro.');
      return;
    }

    setLoading(true);
    const payload: any = {
      consultorio_id: tenant.id,
      beneficiario_id: form.es_libre ? null : form.beneficiario_id,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      tipo_sesion: form.tipo_sesion,
      modalidad: form.modalidad,
      estado: 'agendada',
      notas: form.notas || null,
      titulo: form.es_libre ? form.titulo : null,
      es_libre: form.es_libre,
      created_by: user?.id || null,
    };

    const { error: saveError } = await supabase.from('citas').insert(payload);
    setLoading(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Nueva Cita</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Toggle: Cita Libre o con Beneficiario */}
          <div className="bg-slate-50 p-1 rounded-lg flex">
            <button
              type="button"
              onClick={() => setForm({ ...form, es_libre: false })}
              className={`flex-1 text-xs font-medium py-2 rounded-md transition ${
                !form.es_libre
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Con paciente
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, es_libre: true })}
              className={`flex-1 text-xs font-medium py-2 rounded-md transition ${
                form.es_libre
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cita libre
            </button>
          </div>

          {/* Beneficiario o Título según modo */}
          {!form.es_libre ? (
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Paciente
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre o expediente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select
                required={!form.es_libre}
                value={form.beneficiario_id}
                onChange={(e) => setForm({ ...form, beneficiario_id: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Selecciona un paciente</option>
                {beneficiariosFiltrados.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.codigo_expediente}] {b.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Título de la cita libre
              </label>
              <input
                type="text"
                required={form.es_libre}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Reunión, Supervisión, Trámite..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                💡 Podés vincular un expediente después
              </p>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Fecha
            </label>
            <input
              type="date"
              required
              min={formatLocalDate(new Date())}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {(fechaPasada || fechaNoLaboral) && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fechaPasada ? 'Fecha pasada' : 'Día no laborable'}
              </p>
            )}
            {diaSaturado && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Día saturado ({citasDelDia}/{config.max_citas_por_dia})
              </p>
            )}
            {!fechaPasada && !fechaNoLaboral && !diaSaturado && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {citasDelDia}/{config.max_citas_por_dia} citas este día
              </p>
            )}
          </div>

          {/* Slots de hora */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Hora inicio
            </label>
            <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1">
              {slotsDisponibles.map((slot) => (
                <button
                  key={slot.inicio}
                  type="button"
                  disabled={slot.ocupado}
                  onClick={() =>
                    setForm({
                      ...form,
                      hora_inicio: slot.inicio,
                      hora_fin: minutesToTime(
                        timeToMinutes(slot.inicio) + config.duracion_cita_minutos
                      ),
                    })
                  }
                  className={`text-xs py-2 rounded-md font-medium transition ${
                    form.hora_inicio === slot.inicio
                      ? 'bg-blue-600 text-white'
                      : slot.ocupado
                      ? 'bg-rose-50 text-rose-400 line-through cursor-not-allowed'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {slot.inicio}
                </button>
              ))}
            </div>
          </div>

          {/* Hora fin */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Hora fin
            </label>
            <input
              type="time"
              required
              value={form.hora_fin}
              onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {form.hora_inicio >= form.hora_fin && (
              <p className="text-xs text-rose-600 mt-1">
                La hora de fin debe ser posterior
              </p>
            )}
          </div>

          {/* Tipo y modalidad */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Tipo
              </label>
              <select
                value={form.tipo_sesion}
                onChange={(e) => setForm({ ...form, tipo_sesion: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
                <option value="familiar">Familiar</option>
                <option value="pareja">Pareja</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Modalidad
              </label>
              <select
                value={form.modalidad}
                onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="presencial">Presencial</option>
                <option value="online">En línea</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Notas
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              rows={2}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Notas sobre la sesión..."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
