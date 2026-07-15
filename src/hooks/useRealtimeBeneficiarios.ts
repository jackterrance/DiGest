import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';

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

  const fetchBeneficiarios = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('beneficiarios_expedientes')
      .select('id, nombre_completo, codigo_expediente, estado, consultorio_id')
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

    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      await fetchBeneficiarios();

      if (!mounted) return;

      channel = supabase.channel(`beneficiarios-${tenant.id}`);

      channel
        .on(
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
        )
        .subscribe();
    };

    setup();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [tenant, fetchBeneficiarios]);

  return { beneficiarios, loading, refetch: fetchBeneficiarios };
}
