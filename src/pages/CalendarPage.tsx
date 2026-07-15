import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  Eye,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useRealtimeCitas } from '../hooks/useRealtimeCitas';
import { useRealtimeBeneficiarios } from '../hooks/useRealtimeBeneficiarios';
import { useTenantConfig } from '../hooks/useTenantConfig';
import { AppointmentModal } from '../components/calendar/AppointmentModal';
import { NuevaCitaModal } from '../components/calendar/NuevaCitaModal';
import {
  formatLocalDate,
  isSameDay,
  isPastDate,
  isWorkingDay,
} from '../lib/dateUtils';

export default function CalendarPage() {
  const { tenant } = useTenant();
  const { citas, refetch } = useRealtimeCitas();
  const { beneficiarios } = useRealtimeBeneficiarios();
  const { config } = useTenantConfig();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterEstado, setFilterEstado] = useState('todos');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState<Date | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  };

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const citasFiltradas = citas.filter((c) => {
    if (filterEstado === 'todos') return true;
    return c.estado === filterEstado;
  });

  const totalCitasMes = citasFiltradas.length;
  const completadasMes = citasFiltradas.filter((c) => c.estado === 'completada').length;

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const citasDelDiaSeleccionado = selectedDayDetail
    ? citasFiltradas.filter((c) => c.fecha === formatLocalDate(selectedDayDetail))
    : [];

  // Helper: obtener info de bloqueo de un día
  const getDayStatus = (day: Date) => {
    const fechaStr = formatLocalDate(day);
    const dayCitas = citas.filter(
      (c) => c.fecha === fechaStr && c.estado !== 'cancelada'
    );
    const saturado = dayCitas.length >= config.max_citas_por_dia;
    const pasado = isPastDate(day);
    const noLaboral = !isWorkingDay(day, config.dias_laborales);
    return { saturado, pasado, noLaboral, count: dayCitas.length };
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Agenda de Citas</h1>
            <p className="text-sm text-slate-500">
              Administra el flujo de pacientes y horarios
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-md transition text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs sm:text-sm font-semibold text-slate-700 min-w-[110px] text-center">
              {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-md transition text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="agendada">Agendadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <button
            onClick={() => {
              setModalInitialDate(formatLocalDate(new Date()));
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total del Mes</p>
            <p className="text-lg font-bold text-slate-800">{totalCitasMes} turnos</p>
          </div>
        </div>
        <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Completadas</p>
            <p className="text-lg font-bold text-slate-800">{completadasMes} citas</p>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-slate-50 to-slate-100 p-3.5 border border-slate-200 rounded-xl flex items-center justify-center text-center">
          <p className="text-xs text-slate-500">
            💡 <span className="font-medium">Tip móvil:</span> Tocá cualquier día para ver detalle.
          </p>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-center py-3 font-semibold text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
          {diasSemana.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[85px] sm:auto-rows-[120px] divide-x divide-y divide-slate-100">
          {getDaysInMonth().map((day, idx) => {
            if (!day)
              return <div key={`empty-${idx}`} className="bg-slate-50/30" />;

            const { saturado, pasado, noLaboral, count } = getDayStatus(day);
            const dayCitas = citasFiltradas.filter((c) => {
              const [y, m, d] = c.fecha.split('-').map(Number);
              return (
                d === day.getDate() &&
                m - 1 === day.getMonth() &&
                y === day.getFullYear()
              );
            });

            const bloqueado = pasado || noLaboral;

            return (
              <div
                key={day.toString()}
                onClick={() => {
                  if (bloqueado) return;
                  setSelectedDayDetail(day);
                }}
                className={`p-1.5 sm:p-2 transition flex flex-col space-y-1 overflow-hidden relative group ${
                  bloqueado
                    ? 'bg-slate-100/50 cursor-not-allowed opacity-60'
                    : 'hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold ${
                      saturado
                        ? 'text-rose-500'
                        : bloqueado
                        ? 'text-slate-300'
                        : 'text-slate-600 group-hover:text-blue-500'
                    } transition`}
                  >
                    {day.getDate()}
                  </span>
                  {count > 0 && !bloqueado && (
                    <span
                      className={`sm:hidden text-[9px] text-white font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                        saturado ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {saturado && (
                    <span className="hidden sm:inline text-[9px] text-rose-500 font-bold">
                      LLENO
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col space-y-1 overflow-y-auto h-full pb-2">
                  {dayCitas.slice(0, 3).map((cita) => {
                    const paciente = cita.beneficiario_id
                      ? beneficiarios.find((b) => b.id === cita.beneficiario_id)
                      : null;
                    const label = cita.es_libre
                      ? cita.titulo || 'Libre'
                      : paciente?.nombre_completo || 'Libre';
                    return (
                      <div
                        key={cita.id}
                        className={`text-[10px] p-1 rounded border truncate leading-tight ${
                          cita.estado === 'completada'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : cita.estado === 'cancelada'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <span className="font-semibold block truncate">
                          {cita.hora_inicio.substring(0, 5)} - {label}
                        </span>
                      </div>
                    );
                  })}
                  {dayCitas.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-medium text-center block">
                      + {dayCitas.length - 3} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Detalle del día */}
      {selectedDayDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-xl p-5 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Citas del {selectedDayDetail.getDate()} de{' '}
                  {meses[selectedDayDetail.getMonth()]}
                </h3>
                <p className="text-xs text-slate-400">Distribución horaria</p>
              </div>
              <button
                onClick={() => {
                  setModalInitialDate(formatLocalDate(selectedDayDetail));
                  setShowAddModal(true);
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>

            <div className="space-y-2.5">
              {citasDelDiaSeleccionado.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No hay consultas agendadas
                </p>
              ) : (
                citasDelDiaSeleccionado
                  .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                  .map((cita) => {
                    const paciente = cita.beneficiario_id
                      ? beneficiarios.find((b) => b.id === cita.beneficiario_id)
                      : null;
                    const label = cita.es_libre
                      ? cita.titulo || 'Cita libre'
                      : paciente?.nombre_completo || 'Paciente';
                    return (
                      <div
                        key={cita.id}
                        onClick={() => setSelectedAppointmentId(cita.id)}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-2 hover:scale-[1.01] cursor-pointer transition ${
                          cita.estado === 'completada'
                            ? 'bg-emerald-50/60 border-emerald-100'
                            : cita.estado === 'cancelada'
                            ? 'bg-rose-50/60 border-rose-100'
                            : 'bg-blue-50/60 border-blue-100'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {cita.hora_inicio.substring(0, 5)} -{' '}
                            {cita.hora_fin.substring(0, 5)}
                          </div>
                          <p className="text-sm font-semibold truncate text-slate-800">
                            {label}
                          </p>
                          <p className="text-[11px] text-slate-500 capitalize">
                            {cita.modalidad} · {cita.tipo_sesion}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </div>
                    );
                  })
              )}
            </div>

            <button
              onClick={() => setSelectedDayDetail(null)}
              className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Nueva cita */}
{showAddModal && (
  <NuevaCitaModal
    initialDate={modalInitialDate}
    onClose={() => setShowAddModal(false)}
    onSaved={() => {
      // Realtime actualiza solo - no hace falta refetch
    }}
  />
)}


      {/* Modal: Detalle/edición */}
      {selectedAppointmentId && (
        <AppointmentModal
          appointmentId={selectedAppointmentId}
          onClose={() => {
            setSelectedAppointmentId(null);
          }}
        />
      )}
    </div>
  );
}
