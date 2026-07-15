import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Beneficiario {
  id: string;
  nombre_completo: string;
  codigo_expediente: string;
  estado: string;
  consultorio_id: string;
}

export function useRealtimeBeneficiarios() {
  const { tenant } = useTenant();
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchBeneficiarios = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('beneficiarios_expedientes')
      .select('id, nombre_completo, codigo_expediente, estado, consultorio_id')  // 👈 estado
      .eq('consultorio_id', tenant.id)
      .order('nombre_completo', { ascending: true });
    if (!error && data) setBeneficiarios(data as Beneficiario[]);
    setLoading(false);
  }, [tenant]);

  useEffect(() => {
    if (!tenant) {
      setBeneficiarios([]);
      return;
    }

    // Limpiar cualquier canal previo
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // 1) Carga inicial
    fetchBeneficiarios();

    // 2) Crear canal sincrónicamente (no async)
    const channelName = `beneficiarios-${tenant.id}-${Date.now()}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false }, presence: { key: '' } },
    });

    // 3) Registrar listeners ANTES de subscribe
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'beneficiarios_expedientes',
        filter: `consultorio_id=eq.${tenant.id}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setBeneficiarios((prev) => [...prev, payload.new as Beneficiario]);
        } else if (payload.eventType === 'UPDATE') {
          setBeneficiarios((prev) =>
            prev.map((b) => (b.id === payload.new.id ? (payload.new as Beneficiario) : b))
          );
        } else if (payload.eventType === 'DELETE') {
          setBeneficiarios((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      }
    );

    // 4) Subscribe DESPUÉS de registrar listeners
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // OK
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Error en canal realtime beneficiarios');
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tenant, fetchBeneficiarios]);

  return { beneficiarios, loading, refetch: fetchBeneficiarios };
}
