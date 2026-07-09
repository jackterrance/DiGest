import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'
import { dayjs } from '../utils/dates'
import type { Dayjs } from 'dayjs'

export interface ReportStats {
  pacientesActivos: number
  pacientesInactivos: number
  pacientesAlta: number
  pacientesBaja: number
  expedientesTotal: number
  citasMes: number
  ingresosEfectivo: number
  ingresosTransferencia: number
  ingresosTarjeta: number
  ingresosOtro: number
  ingresosTotal: number
  mesLabel: string
  citasPorEstado: {
    agendada: number
    completada: number
    cancelada: number
    reagendada: number
    no_asistio: number
  }
}

export function useReports(mesFecha?: Dayjs) {
  const { tenant } = useTenant()
  const fecha = mesFecha || dayjs()
  const [stats, setStats] = useState<ReportStats>({
    pacientesActivos: 0,
    pacientesInactivos: 0,
    pacientesAlta: 0,
    pacientesBaja: 0,
    expedientesTotal: 0,
    citasMes: 0,
    ingresosEfectivo: 0,
    ingresosTransferencia: 0,
    ingresosTarjeta: 0,
    ingresosOtro: 0,
    ingresosTotal: 0,
    mesLabel: fecha.format('MMMM YYYY'),
    citasPorEstado: { agendada: 0, completada: 0, cancelada: 0, reagendada: 0, no_asistio: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    setLoading(true)

    const inicio = fecha.startOf('month').format('YYYY-MM-DD')
    const fin = fecha.endOf('month').format('YYYY-MM-DD')
    const inicioISO = fecha.startOf('month').toISOString()
    const finISO = fecha.endOf('month').toISOString()

    ;(async () => {
      // Pacientes por estado
      const { data: pacientesData } = await (supabase.from('beneficiarios_expedientes') as any)
        .select('estado')
        .eq('consultorio_id', tenant.id)

      const counts = { activos: 0, inactivos: 0, alta: 0, baja: 0 }
      ;(pacientesData || []).forEach((p: any) => {
        if (p.estado === 'activo') counts.activos++
        else if (p.estado === 'inactivo') counts.inactivos++
        else if (p.estado === 'alta') counts.alta++
        else if (p.estado === 'baja') counts.baja++
      })
      const totalExp = (pacientesData || []).length

      // Citas del mes con estado
      const { data: citasData } = await (supabase.from('citas') as any)
        .select('estado')
        .eq('consultorio_id', tenant.id)
        .gte('fecha', inicio).lte('fecha', fin)

      const citasPorEstado = { agendada: 0, completada: 0, cancelada: 0, reagendada: 0, no_asistio: 0 }
      ;(citasData || []).forEach((c: any) => {
        if (c.estado in citasPorEstado) citasPorEstado[c.estado as keyof typeof citasPorEstado]++
      })

      // Pagos del mes
      const { data: pagosData } = await (supabase.from('pagos_citas') as any)
        .select('monto, metodo_pago')
        .eq('consultorio_id', tenant.id)
        .eq('estado', 'pagado')
        .gte('fecha_pago', inicioISO)
        .lte('fecha_pago', finISO)

      const ingresos = { efectivo: 0, transferencia: 0, tarjeta: 0, otro: 0 }
      ;(pagosData || []).forEach((p: any) => {
        const m = Number(p.monto)
        if (p.metodo_pago === 'efectivo') ingresos.efectivo += m
        else if (p.metodo_pago === 'transferencia') ingresos.transferencia += m
        else if (p.metodo_pago === 'tarjeta') ingresos.tarjeta += m
        else ingresos.otro += m
      })

      setStats({
        pacientesActivos: counts.activos,
        pacientesInactivos: counts.inactivos,
        pacientesAlta: counts.alta,
        pacientesBaja: counts.baja,
        expedientesTotal: totalExp,
        citasMes: (citasData || []).length,
        ingresosEfectivo: ingresos.efectivo,
        ingresosTransferencia: ingresos.transferencia,
        ingresosTarjeta: ingresos.tarjeta,
        ingresosOtro: ingresos.otro,
        ingresosTotal: ingresos.efectivo + ingresos.transferencia + ingresos.tarjeta + ingresos.otro,
        mesLabel: fecha.format('MMMM YYYY'),
        citasPorEstado,
      })
      setLoading(false)
    })()
  }, [tenant, fecha])

  return { stats, loading, fecha }
}