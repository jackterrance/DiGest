import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantContext'
import type { InventarioItem } from '../../types/database'

interface Props { item: InventarioItem | null; onClose: () => void }

const empty = {
  nombre: '',
  categoria: 'material_clinico' as const,
  unidad_medida: 'pieza',
  stock_actual: 0,
  stock_minimo: 5,
  precio_unitario: 0,
  proveedor: '',
}

export function InventoryForm({ item, onClose }: Props) {
  const { tenant } = useTenant()
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) setForm({ ...empty, ...item })
    else setForm(empty)
  }, [item])

  const handleSave = async () => {
    if (!tenant) return
    if (!form.nombre) { alert('El nombre es obligatorio'); return }
    setLoading(true)
    if (item) {
      await (supabase.from('inventario_suministros') as any).update(form).eq('id', item.id)
    } else {
      await (supabase.from('inventario_suministros') as any).insert({ ...form, consultorio_id: tenant.id })
    }
    setLoading(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!item) return
    if (!confirm('Eliminar este producto?')) return
    await supabase.from('inventario_suministros').delete().eq('id', item.id)
    onClose()
  }

  return (
    <Modal onClose={onClose} title={item ? 'Editar producto' : 'Nuevo producto'}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-600">Nombre *</label>
          <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" placeholder="Ej. Hojas carta" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600">Categoria</label>
            <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm">
              <option value="papeleria">Papeleria</option>
              <option value="material_clinico">Material clinico</option>
              <option value="pruebas">Pruebas psicologicas</option>
              <option value="limpieza">Limpieza</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600">Unidad</label>
            <input value={form.unidad_medida} onChange={e => setForm({...form, unidad_medida: e.target.value})}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-slate-600">Stock actual</label>
            <input type="number" min="0" value={form.stock_actual}
              onChange={e => setForm({...form, stock_actual: parseInt(e.target.value) || 0})}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Stock min.</label>
            <input type="number" min="0" value={form.stock_minimo}
              onChange={e => setForm({...form, stock_minimo: parseInt(e.target.value) || 0})}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Precio</label>
            <input type="number" step="0.01" min="0" value={form.precio_unitario}
              onChange={e => setForm({...form, precio_unitario: parseFloat(e.target.value) || 0})}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600">Proveedor</label>
          <input value={form.proveedor || ''} onChange={e => setForm({...form, proveedor: e.target.value})}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
        </div>

        <div className="flex gap-2 pt-2">
          {item && <Button variant="danger" onClick={handleDelete}>Eliminar</Button>}
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1">
            {item ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}