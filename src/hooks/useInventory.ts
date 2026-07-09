import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'
import type { InventarioItem } from '../types/database'

export function useInventory() {
  const { tenant } = useTenant()
  const [items, setItems] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!tenant) return
    setLoading(true)
    const { data } = await (supabase.from('inventario_suministros') as any)
      .select('*')
      .eq('consultorio_id', tenant.id)
      .order('nombre')
    setItems(data || [])
    setLoading(false)
  }, [tenant])

  useEffect(() => { load() }, [load])

  const adjustStock = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newStock = Math.max(0, item.stock_actual + delta)
    await (supabase.from('inventario_suministros') as any).update({ stock_actual: newStock }).eq('id', id)
    load()
  }

  return { items, loading, adjustStock, reload: load }
}