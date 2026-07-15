import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

export interface Cita {
  id: string;
  consultorio_id: string;
  beneficiario_id: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  tipo_sesion: string;
  modalidad: string;
  notas?: string | null;
  titulo?: string | null;
  es_libre: boolean;
  created_at?: string;
}

export function useRealtimeCitas() {
  const { tenant } = useTenant();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar citas iniciales
  const fetchCitas = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('consultorio_id', tenant.id)
      .order('fecha', { ascending: true });

    if (!error && data) setCitas(data as Cita[]);
    setLoading(false);
  }, [tenant]);

  // Suscripción realtime
  useEffect(() => {
    if (!tenant) return;

    fetchCitas();

    const channel = supabase
      .channel(`citas-${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citas',
          filter: `consultorio_id=eq.${tenant.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCitas((prev) => [...prev, payload.new as Cita]);
          } else if (payload.eventType === 'UPDATE') {
            setCitas((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Cita) : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setCitas((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant, fetchCitas]);

  return { citas, loading, refetch: fetchCitas };
}
