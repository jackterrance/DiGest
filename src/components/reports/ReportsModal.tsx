import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useReports } from '../../hooks/useReports'
import { Users, FileText, CalendarDays, TrendingUp, Wallet, Banknote, CreditCard, MoreHorizontal, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, RotateCw, UserX } from 'lucide-react'
import { formatMoney } from '../../utils/formatters'
import { dayjs } from '../../utils/dates'
import { Spinner } from '../ui/Spinner'

export function ReportsModal({ onClose }: { onClose: () => void }) {
  const [fecha, setFecha] = useState(dayjs())
  const { stats, loading } = useReports(fecha)

  const irMesAnterior = () => setFecha(fecha.subtract(1, 'month'))
  const irMesSiguiente = () => setFecha(fecha.add(1, 'month'))
  const irMesActual = () => setFecha(dayjs())
  const esMesActual = fecha.isSame(dayjs(), 'month')

  return (
    <Modal onClose={onClose} title="Reportes mensuales">
      {/* Navegador de mes */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 mb-4 -mt-2">
        <button onClick={irMesAnterior} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition" title="Mes anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center flex-1">
          <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
            {fecha.format('MMMM YYYY')}
          </p>
          {!esMesActual && (
            <button onClick={irMesActual} className="text-[10px] text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Ir al mes actual
            </button>
          )}
        </div>
        <button onClick={irMesSiguiente} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition" title="Mes siguiente" disabled={esMesActual}>
          <ChevronRight className={'w-4 h-4 ' + (esMesActual ? 'text-slate-300 dark:text-slate-600' : '')} />
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-4">
          {/* Pacientes */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> Pacientes / Expedientes
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.pacientesActivos}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Activos</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.pacientesInactivos}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Inactivos</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.pacientesAlta}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Alta</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{stats.pacientesBaja}</p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Baja</p>
              </div>
            </div>
            <div className="mt-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-xs text-primary-700 dark:text-primary-300 font-medium flex items-center gap-1">
                <FileText className="w-3 h-3" /> Total expedientes
              </span>
              <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{stats.expedientesTotal}</span>
            </div>
          </div>

          {/* Citas del mes */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Citas del mes
            </p>
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-4 text-white">
              <p className="text-4xl font-bold mb-3">{stats.citasMes}</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="bg-white/10 rounded-lg p-2 flex items-center gap-2">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="opacity-80 text-[10px]">Agendadas</p>
                    <p className="font-semibold">{stats.citasPorEstado.agendada}</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="opacity-80 text-[10px]">Completadas</p>
                    <p className="font-semibold">{stats.citasPorEstado.completada}</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 flex items-center gap-2">
                  <XCircle className="w-3 h-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="opacity-80 text-[10px]">Canceladas</p>
                    <p className="font-semibold">{stats.citasPorEstado.cancelada}</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 flex items-center gap-2">
                  <UserX className="w-3 h-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="opacity-80 text-[10px]">No asistio</p>
                    <p className="font-semibold">{stats.citasPorEstado.no_asistio}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ingresos del mes */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Ingresos del mes
            </p>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 text-white">
              <p className="text-3xl font-bold mb-3">{formatMoney(stats.ingresosTotal)}</p>
              <div className="space-y-1.5 text-sm">
                <div className="bg-white/10 rounded-lg p-2.5 flex items-center justify-between">
                  <span className="opacity-90 text-xs flex items-center gap-1.5">
                    <Banknote className="w-3 h-3" /> Efectivo
                  </span>
                  <span className="font-semibold">{formatMoney(stats.ingresosEfectivo)}</span>
                </div>
                <div className="bg-white/10 rounded-lg p-2.5 flex items-center justify-between">
                  <span className="opacity-90 text-xs flex items-center gap-1.5">
                    <Wallet className="w-3 h-3" /> Transferencia
                  </span>
                  <span className="font-semibold">{formatMoney(stats.ingresosTransferencia)}</span>
                </div>
                {stats.ingresosTarjeta > 0 && (
                  <div className="bg-white/10 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="opacity-90 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" /> Tarjeta
                    </span>
                    <span className="font-semibold">{formatMoney(stats.ingresosTarjeta)}</span>
                  </div>
                )}
                {stats.ingresosOtro > 0 && (
                  <div className="bg-white/10 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="opacity-90 text-xs flex items-center gap-1.5">
                      <MoreHorizontal className="w-3 h-3" /> Otro
                    </span>
                    <span className="font-semibold">{formatMoney(stats.ingresosOtro)}</span>
                  </div>
                )}
              </div>
            </div>
            {stats.ingresosTotal === 0 && stats.citasMes === 0 && (
              <p className="text-center text-xs text-slate-400 py-2 mt-2">
                Sin actividad registrada en {fecha.format('MMMM YYYY')}
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}