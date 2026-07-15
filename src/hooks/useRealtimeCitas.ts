import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  notas: string | null;
  titulo: string | null;
  es_libre: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useRealtimeCitas() {
  const { tenant } = useTenant();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

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

  useEffect(() => {
    if (!tenant) {
      setCitas([]);
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    fetchCitas();

    const channelName = `citas-${tenant.id}-${Date.now()}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false }, presence: { key: '' } },
    });

    channel.on(
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
    );

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Error en canal realtime citas');
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tenant, fetchCitas]);

  return { citas, loading, refetch: fetchCitas };
}
