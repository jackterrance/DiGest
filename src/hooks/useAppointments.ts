import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'
import { dayjs } from '../utils/dates'
import type { Cita } from '../types/database'

export function useAppointments(fecha?: string) {
  const { tenant } = useTenant()
  const [appointments, setAppointments] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [diasConCitas, setDiasConCitas] = useState<Set<string>>(new Set())

  const load = async () => {
    if (!tenant) return
    setLoading(true)
    let q = supabase
      .from('citas')
      .select('*, beneficiario:beneficiarios_expedientes(id, nombre_completo, codigo_expediente)')
      .eq('consultorio_id', tenant.id)
      .order('hora_inicio')
    if (fecha) q = q.eq('fecha', fecha)
    const { data } = await q
    setAppointments((data as any) || [])

    if (!fecha) {
      const inicio = dayjs().startOf('month').format('YYYY-MM-DD')
      const fin = dayjs().endOf('month').format('YYYY-MM-DD')
      const { data: monthData } = await supabase
        .from('citas')
        .select('fecha')
        .eq('consultorio_id', tenant.id)
        .gte('fecha', inicio).lte('fecha', fin)
      const set = new Set((monthData || []).map((c: any) => c.fecha_hora || c.fecha))
      setDiasConCitas(set)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [tenant, fecha])
  return { appointments, loading, reload: load, diasConCitas }
}