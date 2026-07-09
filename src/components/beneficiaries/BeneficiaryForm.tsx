import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantContext'
import { useAuth } from '../../context/AuthContext'

interface Props { onClose: () => void }

export function BeneficiaryForm({ onClose }: Props) {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    codigo_expediente: '',
    nombre_completo: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_parentesco: '',
    motivo_consulta: '',
    estado: 'activo',
  })

  const handleSave = async () => {
    if (!tenant) return
    if (!form.nombre_completo || !form.codigo_expediente) {
      alert('Nombre y codigo de expediente son obligatorios')
      return
    }
    setLoading(true)
    const { error } = await (supabase.from('beneficiarios_expedientes') as any).insert({
      ...form,
      consultorio_id: tenant.id,
      created_by: user?.id,
    })
    setLoading(false)
    if (error) alert('Error: ' + error.message)
    else onClose()
  }

  return (
    <Modal onClose={onClose} title="Nuevo expediente">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600">Codigo *</label>
            <input value={form.codigo_expediente}
              onChange={e => setForm({...form, codigo_expediente: e.target.value})}
              placeholder="EXP-001"
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Estado</label>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="alta">Alta</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600">Nombre completo *</label>
          <input value={form.nombre_completo}
            onChange={e => setForm({...form, nombre_completo: e.target.value})}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600">F. Nacimiento</label>
            <input type="date" value={form.fecha_nacimiento}
              onChange={e => setForm({...form, fecha_nacimiento: e.target.value})}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Genero</label>
            <select value={form.genero} onChange={e => setForm({...form, genero: e.target.value})}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
              <option value="">-</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="Otro">Otro</option>
              <option value="Prefiero_no_decir">Prefiero no decir</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600">Telefono</label>
            <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600">Direccion</label>
          <input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">CONTACTO DE EMERGENCIA</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600">Nombre</label>
              <input value={form.contacto_emergencia_nombre}
                onChange={e => setForm({...form, contacto_emergencia_nombre: e.target.value})}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-600">Parentesco</label>
              <input value={form.contacto_emergencia_parentesco}
                onChange={e => setForm({...form, contacto_emergencia_parentesco: e.target.value})}
                placeholder="Ej. Madre, Esposo"
                className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-2">
            <label className="text-xs text-slate-600">Telefono</label>
            <input value={form.contacto_emergencia_telefono}
              onChange={e => setForm({...form, contacto_emergencia_telefono: e.target.value})}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-600">Motivo de consulta</label>
          <textarea value={form.motivo_consulta}
            onChange={e => setForm({...form, motivo_consulta: e.target.value})}
            rows={3} className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm"
            placeholder="Informacion sensible - confidencial" />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1">Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}