import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 
import { useAuth } from '../context/AuthContext'
import { 
  Wallet, 
  Calendar, 
  Users, 
  RefreshCw, 
  ShieldCheck, 
  X, 
  TrendingUp, 
  CreditCard, 
  DollarSign 
} from 'lucide-react'

type ModalType = 'ingresos' | 'consultas' | 'pacientes' | null
type RangeType = 'hoy' | 'semana' | 'mes'

// Interfaces explícitas para evitar errores de tipo 'never'
interface ExpedienteRow {
  status: string | null
}

interface CitaRow {
  status: string | null
  fecha: string | null
}

interface PagoRow {
  monto: number | null
  metodo_pago: string | null
}

export function ReportsScreen() {
  // Forzamos el tipado del user del contexto para incluir consultorio_id
  const { user } = useAuth() as { user: { consultorio_id?: string } | null }
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [dateRange, setDateRange] = useState<RangeType>('mes')
  const [loading, setLoading] = useState(false)

  const [stats, setStats] = useState({
    ingresosTotales: 0,
    ingresosEfectivo: 0,
    ingresosTransferencia: 0,
    consultasTotales: 0,
    consultasCompletadas: 0,
    consultasCanceladas: 0,
    pacientesActivos: 0,
    pacientesInactivos: 0,
  })

  const fetchReportData = async () => {
    if (!user?.consultorio_id) return
    setLoading(true)

    try {
      // 1. Obtener conteo de Expedientes Clínicos tipado
      const { data: expedientes } = await supabase
        .from('beneficiarios_expedientes')
        .select('status')
        .eq('consultorio_id', user.consultorio_id) as { data: ExpedienteRow[] | null }

      const activos = expedientes?.filter(p => (p.status ?? '') === 'activo').length || 0
      const inactivos = expedientes?.filter(p => (p.status ?? '') === 'inactivo').length || 0

      // Definir rango de fecha para filtrar citas y pagos
      const ahora = new Date()
      let fechaFiltro = new Date()
      if (dateRange === 'hoy') {
        fechaFiltro.setHours(0, 0, 0, 0)
      } else if (dateRange === 'semana') {
        fechaFiltro.setDate(ahora.getDate() - 7)
      } else if (dateRange === 'mes') {
        fechaFiltro.setMonth(ahora.getMonth() - 1)
      }
      const isoFechaFiltro = fechaFiltro.toISOString()

      // 2. Obtener Citas tipado
      const { data: citasData } = await supabase
        .from('citas')
        .select('status, fecha')
        .eq('consultorio_id', user.consultorio_id)
        .gte('fecha', isoFechaFiltro) as { data: CitaRow[] | null }

      let completadas = 0
      let canceladas = 0

      citasData?.forEach(c => {
        if (c.status === 'completada') completadas++
        else if (c.status === 'cancelada') canceladas++
      })

      // 3. Obtener Ingresos tipado
      const { data: pagosData } = await supabase
        .from('pagos_citas')
        .select('monto, metodo_pago')
        .eq('consultorio_id', user.consultorio_id)
        .gte('created_at', isoFechaFiltro) as { data: PagoRow[] | null }

      let totalIngresos = 0
      let efectivo = 0
      let transferencia = 0

      pagosData?.forEach(p => {
        const montoPago = Number(p.monto) || 0
        totalIngresos += montoPago
        
        const metodo = (p.metodo_pago ?? '').toLowerCase()
        if (metodo === 'efectivo') {
          efectivo += montoPago
        } else if (metodo === 'transferencia' || metodo === 'banco') {
          transferencia += montoPago
        }
      })

      setStats({
        ingresosTotales: totalIngresos,
        ingresosEfectivo: efectivo,
        ingresosTransferencia: transferencia,
        consultasTotales: citasData?.length || 0,
        consultasCompletadas: completadas,
        consultasCanceladas: canceladas,
        pacientesActivos: activos,
        pacientesInactivos: inactivos
      })

    } catch (error) {
      console.error("Error cargando reportes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [dateRange, user?.consultorio_id])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 p-4 font-sans">
      
      

      {/* Tarjeta de Control Superior con Selector de Fecha y Botón de Recarga integrado */}
<div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm mb-5 flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
      <TrendingUp className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-sm font-semibold text-slate-700">Rango del Reporte</h3>
      <p className="text-xs text-slate-400 hidden sm:block">Filtra las tarjetas en tiempo real</p>
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

    {/* Botón de actualizar reubicado elegantemente aquí */}
    <button 
      onClick={fetchReportData}
      className="p-2 bg-white border border-slate-200/80 rounded-xl shadow-sm text-slate-600 hover:bg-slate-50 transition active:scale-95">
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
     </button>
      </div>
      </div>

      {/* REJILLA DE TARJETAS INTERACTIVAS */}
      <div className="space-y-4">
        
        {/* Tarjeta 1: Ingresos */}
        <div 
          onClick={() => setActiveModal('ingresos')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition duration-200 cursor-pointer flex justify-between items-center group"
        >
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Ingresos</span>
            <span className="text-2xl font-bold text-slate-800">${stats.ingresosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta 2: Consultas */}
        <div 
          onClick={() => setActiveModal('consultas')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition duration-200 cursor-pointer flex justify-between items-center group"
        >
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Consultas Registradas</span>
            <span className="text-2xl font-bold text-slate-800">{stats.consultasTotales}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta 3: Pacientes */}
        <div 
          onClick={() => setActiveModal('pacientes')}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition duration-200 cursor-pointer flex justify-between items-center group"
        >
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Pacientes Activos</span>
            <span className="text-2xl font-bold text-slate-800">{stats.pacientesActivos}</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Banner Informativo Multi-Tenant */}
      <div className="mt-5 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-700 font-semibold block mb-0.5">Aislamiento de datos activo</strong>
          Este panel calcula estadísticas en tiempo real restringidas de forma estricta a tu identificador de consultorio multitenant actual.
        </p>
      </div>

      {/* --- MODAL DETALLADO DINÁMICO --- */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 capitalize">Desglose de {activeModal}</h2>
                <p className="text-xs text-slate-400 font-medium">Viendo historial por rango: <span className="text-emerald-600 uppercase font-bold">{dateRange}</span></p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* DESGLOSE: INGRESOS */}
              {activeModal === 'ingresos' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500 text-white rounded-lg"><DollarSign className="w-4 h-4" /></div>
                      <span className="text-sm font-medium text-slate-600">Efectivo</span>
                    </div>
                    <span className="font-semibold text-slate-800">${stats.ingresosEfectivo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-500 text-white rounded-lg"><CreditCard className="w-4 h-4" /></div>
                      <span className="text-sm font-medium text-slate-600">Transferencias</span>
                    </div>
                    <span className="font-semibold text-slate-800">${stats.ingresosTransferencia.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-slate-700">Gran Total</span>
                    <span className="text-lg font-bold text-emerald-600">${stats.ingresosTotales.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* DESGLOSE: CONSULTAS */}
              {activeModal === 'consultas' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-center">
                      <span className="text-2xs font-bold text-emerald-600 uppercase block tracking-wider">Completadas</span>
                      <span className="text-xl font-bold text-emerald-700">{stats.consultasCompletadas}</span>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl text-center">
                      <span className="text-2xs font-bold text-rose-600 uppercase block tracking-wider">Canceladas</span>
                      <span className="text-xl font-bold text-rose-700">{stats.consultasCanceladas}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Historial de citas en este rango</span>
                    <span className="font-bold text-slate-800">{stats.consultasTotales} citas</span>
                  </div>
                </div>
              )}

              {/* DESGLOSE: PACIENTES */}
              {activeModal === 'pacientes' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Pacientes Activos</span>
                    <span className="font-bold text-indigo-600 text-base">{stats.pacientesActivos}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Pacientes Inactivos</span>
                    <span className="font-bold text-slate-400 text-base">{stats.pacientesInactivos}</span>
                  </div>
                </div>
              )}

            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-xl transition hover:bg-slate-800"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

    </div>
  )
}