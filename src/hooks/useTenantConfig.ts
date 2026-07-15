import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

export interface TenantConfig {
  hora_apertura: string;       // "08:00"
  hora_cierre: string;         // "20:00"
  duracion_cita_minutos: number; // 60
  max_citas_por_dia: number;   // 8
  intervalo_minutos: number;   // 30 (cada cuánto se puede agendar)
  dias_laborales: number[];    // [1,2,3,4,5] = Lun-Vie
}

const DEFAULT_CONFIG: TenantConfig = {
  hora_apertura: '08:00',
  hora_cierre: '20:00',
  duracion_cita_minutos: 60,
  max_citas_por_dia: 8,
  intervalo_minutos: 30,
  dias_laborales: [1, 2, 3, 4, 5],
};

export function useTenantConfig() {
  const { tenant } = useTenant();
  const [config, setConfig] = useState<TenantConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    loadConfig();
  }, [tenant]);

  const loadConfig = async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('consultorios_config')
      .select('*')
      .eq('consultorio_id', tenant.id)
      .maybeSingle();

    if (!error && data) {
      setConfig({ ...DEFAULT_CONFIG, ...data });
    } else {
      // Si no existe, creamos con defaults
      await supabase.from('consultorios_config').insert({
        consultorio_id: tenant.id,
        ...DEFAULT_CONFIG,
      });
    }
    setLoading(false);
  };

  return { config, loading, refetch: loadConfig };
}
