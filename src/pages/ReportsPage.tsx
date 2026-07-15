import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext'; // 👈 AGREGAR
import { useRealtimeCitas } from '../hooks/useRealtimeCitas';
import {
  Wallet, Calendar, Users, RefreshCw, ShieldCheck, X,
  TrendingUp, CreditCard, DollarSign,
} from 'lucide-react';

type ModalType = 'ingresos' | 'consultas' | 'pacientes' | null;
type RangeType = 'hoy' | 'semana' | 'mes';

interface PagoRow {
  id: string;
  monto: number | null;
  metodo_pago: string | null;
  estado: string | null;
  fecha_pago: string;
  consultorio_id: string;
}

interface ExpedienteRow {
  id: string;
  status: string | null;
  consultorio_id: string;
}

export function ReportsScreen() {
  // 👇 USAR useTenant PARA OBTENER consultorio_id
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { citas } = useRealtimeCitas();
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [dateRange, setDateRange] = useState<RangeType>('mes');
  const [pagos, setPagos] = useState<PagoRow[]>([]);
  const [expedientes, setExpedientes] = useState<ExpedienteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    ingresosTotales: 0,
    ingresosEfectivo: 0,
    ingresosTransferencia: 0,
    consultasTotales: 0,
    consultasCompletadas: 0,
    consultasCanceladas: 0,
    pacientesActivos: 0,
    pacientesInactivos: 0,
  });

  const loadData = async () => {
    if (!tenant?.id) {
      console.warn('Sin tenant.id, no se pueden cargar datos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [pagosRes, expRes] = await Promise.all([
        supabase
          .from('pagos_citas')
          .select('id, monto, metodo_pago, estado, fecha_pago, consultorio_id')
          .eq('consultorio_id', tenant.id), // 👈 tenant.id no user.consultorio_id
        supabase
          .from('beneficiarios_expedientes')
          .select('id, status, consultorio_id')
          .eq('consultorio_id', tenant.id),
      ]);

      console.log('Pagos:', pagosRes);
      console.log('Expedientes:', expRes);

      if (pagosRes.error) setError('Error pagos: ' + pagosRes.error.message);
      if (expRes.error) setError('Error exp: ' + expRes.error.message);

      if (pagosRes.data) setPagos(pagosRes.data as PagoRow[]);
      if (expRes.data) setExpedientes(expRes.data as ExpedienteRow[]);
    } catch (err) {
      console.error('Excepción:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) loadData();
  }, [tenant?.id]);

  useEffect(() => {
    calcularStats();
  }, [citas, pagos, expedientes, dateRange]);

  const getFechaFiltro = (): Date => {
    const ahora = new Date();
    if (dateRange === 'hoy') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    } else if (dateRange === 'semana') {
      const d = new Date();
      d.setDate(ahora.getDate() - 7);
      return d;
    } else {
      const d = new Date();
      d.setMonth(ahora.getMonth() - 1);
      return d;
    }
  };

  const calcularStats = () => {
    const fechaFiltro = getFechaFiltro();

    const citasFiltradas = citas.filter((c) => {
      if (!c.fecha) return false;
      const fechaCita = new Date(c.fecha + 'T00:00:00');
      return fechaCita >= fechaFiltro;
    });

    const completadas = citasFiltradas.filter((c) => c.estado === 'completada').length;
    const canceladas = citasFiltradas.filter((c) => c.estado === 'cancelada').length;

    const pagosFiltrados = pagos.filter((p) => {
      if (!p.fecha_pago) return false;
      return new Date(p.fecha_pago) >= fechaFiltro;
    });

    let total = 0;
    let efectivo = 0;
    let transferencia = 0;
    pagosFiltrados.forEach((p) => {
      const monto = Number(p.monto) || 0;
      total += monto;
      const metodo = (p.metodo_pago ?? '').toLowerCase();
      if (metodo === 'efectivo') efectivo += monto;
      else if (metodo === 'transferencia' || metodo === 'banco' || metodo === 'tarjeta') {
        transferencia += monto;
      }
    });

    const activos = expedientes.filter((e) => (e.status ?? '') === 'activo').length;
    const inactivos = expedientes.filter((e) => (e.status ?? '') === 'inactivo').length;

    setStats({
      ingresosTotales: total,
      ingresosEfectivo: efectivo,
      ingresosTransferencia: transferencia,
      consultasTotales: citasFiltradas.length,
      consultasCompletadas: completadas,
      consultasCanceladas: canceladas,
      pacientesActivos: activos,
      pacientesInactivos: inactivos,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 p-4 font-sans">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Rango del Reporte</h3>
            <p className="text-xs text-slate-400 hidden sm:block">Sincronizado en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
            {(['hoy', 'semana', 'mes'] as RangeType[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`text-xs font-medium py-1.5 px-3.5 rounded-lg capitalize transition ${
                  dateRange === range
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200/80 rounded-xl shadow-sm text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-4 text-xs text-rose-700">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-4">
        <div
          onClick={() => setActiveModal('ingresos')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex justify-between items-center group"
        >
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Ingresos
            </span>
            <span className="text-2xl font-bold text-slate-800">
              ${stats.ingresosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveModal('consultas')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition cursor-pointer flex justify-between items-center group"
        >
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Consultas Registradas
            </span>
            <span className="text-2xl font-bold text-slate-800">{stats.consultasTotales}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveModal('pacientes')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex justify-between items-center group"
        >
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Pacientes Activos
            </span>
            <span className="text-2xl font-bold text-slate-800">{stats.pacientesActivos}</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="mt-5 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-700 font-semibold block mb-0.5">
            Datos sincronizados en tiempo real
          </strong>
          Las estadísticas se actualizan automáticamente al agendar, completar o cancelar citas.
        </p>
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 capitalize">
                  Desglose de {activeModal}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Rango: <span className="text-emerald-600 uppercase font-bold">{dateRange}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {activeModal === 'ingresos' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500 text-white rounded-lg">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Efectivo</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      ${stats.ingresosEfectivo.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-500 text-white rounded-lg">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Transferencias</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      ${stats.ingresosTransferencia.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-slate-700">Gran Total</span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${stats.ingresosTotales.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {activeModal === 'consultas' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-center">
                      <span className="text-2xs font-bold text-emerald-600 uppercase block tracking-wider">
                        Completadas
                      </span>
                      <span className="text-xl font-bold text-emerald-700">
                        {stats.consultasCompletadas}
                      </span>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl text-center">
                      <span className="text-2xs font-bold text-rose-600 uppercase block tracking-wider">
                        Canceladas
                      </span>
                      <span className="text-xl font-bold text-rose-700">
                        {stats.consultasCanceladas}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Total en este rango</span>
                    <span className="font-bold text-slate-800">{stats.consultasTotales} citas</span>
                  </div>
                </div>
              )}

              {activeModal === 'pacientes' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Activos</span>
                    <span className="font-bold text-indigo-600 text-base">
                      {stats.pacientesActivos}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Inactivos</span>
                    <span className="font-bold text-slate-400 text-base">
                      {stats.pacientesInactivos}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-slate-800"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
