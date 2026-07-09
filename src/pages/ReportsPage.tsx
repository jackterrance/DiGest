import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'
import { BarChart3, TrendingUp, Users, Calendar, AlertTriangle, Wallet, RefreshCw } from 'lucide-react'

export default function ReportsPage() {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    ingresosTotales: 0,
    totalCitas: 0,
    totalPacientes: 0,
    insumosCriticos: 0,
  })

  useEffect(() => {
    if (tenant) {
      loadReportData()
    }
  }, [tenant])

  const loadReportData = async () => {
    if (!tenant) return
    setLoading(true)

    try {
      // 1. Calcular Ingresos Totales de Pagos
      const { data: pagos } = await (supabase.from('pagos_citas') as any)
        .select('monto')
        .eq('consultorio_id', tenant.id)
        .eq('estado', 'pagado')
      const ingresos = pagos?.reduce((sum: number, item: any) => sum + (item.monto || 0), 0) || 0

      // 2. Conteo de Citas
      const { count: countCitas } = await (supabase.from('citas') as any)
        .select('*', { count: 'exact', head: true })
        .eq('consultorio_id', tenant.id)

      // 3. Conteo de Expedientes/Pacientes Activos
      const { count: countPacientes } = await (supabase.from('beneficiarios_expedientes') as any)
        .select('*', { count: 'exact', head: true })
        .eq('consultorio_id', tenant.id)
        .eq('estado', 'activo')

      // 4. Conteo de Insumos con bajo stock (ej. menor o igual a 5 unidades)
      const { count: countInsumos } = await (supabase.from('inventario_suministros') as any)
        .select('*', { count: 'exact', head: true })
        .eq('consultorio_id', tenant.id)
        .lte('stock_actual', 5)

      setStats({
        ingresosTotales: ingresos,
        totalCitas: countCitas || 0,
        totalPacientes: countPacientes || 0,
        insumosCriticos: countInsumos || 0,
      })
    } catch (err) {
      console.error('Error recolectando reportes:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor)
  }

  return (
  <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full overflow-x-hidden">
    {/* Cabecera */}
    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 w-full gap-2">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg shrink-0">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">Reportes y Estadísticas</h1>
          <p className="text-xs sm:text-sm text-slate-500 truncate">Métricas consolidadas del consultorio clínico</p>
        </div>
      </div>

      <button onClick={loadReportData} disabled={loading}
        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition disabled:opacity-50 shrink-0">
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>

    {/* Grid de Tarjetas de Indicadores Ajustado para Móviles Angostos */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {/* Card Ingresos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm flex items-center justify-between gap-3 min-w-0">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Ingresos Facturados</span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">{formatMoneda(stats.ingresosTotales)}</h3>
        </div>
        <div className="p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl shrink-0">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card Citas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm flex items-center justify-between gap-3 min-w-0">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Consultas Guardadas</span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">{stats.totalCitas}</h3>
        </div>
        <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl shrink-0">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card Pacientes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm flex items-center justify-between gap-3 min-w-0">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pacientes Activos</span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">{stats.totalPacientes}</h3>
        </div>
        <div className="p-2.5 sm:p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl shrink-0">
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Card Inventario Alerta */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm flex items-center justify-between gap-3 min-w-0">
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Alertas de Stock</span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 truncate">
            {stats.insumosCriticos} <span className="text-xs font-normal text-slate-400">ítems</span>
          </h3>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${stats.insumosCriticos > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}>
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>

    {/* Bloque Informativo Adicional */}
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 w-full">
      <TrendingUp className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
        <span className="font-semibold text-slate-800 dark:text-slate-100">Aislamiento de datos activo:</span> Este panel calcula estadísticas en tiempo real restringidas de forma estricta a tu identificador de consultorio mutitenant actual.
      </div>
    </div>
  </div>
)
}