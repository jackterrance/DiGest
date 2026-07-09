import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantContext'
import { useAuth } from '../../context/AuthContext'
import { Trash2, CheckCircle2, Clock, DollarSign, Receipt } from 'lucide-react'
import { formatMoney } from '../../utils/formatters'
import { PaymentReceipt } from './PaymentReceipt'

export function PaymentSection({ citaId }: { citaId: string }) {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const [pagos, setPagos] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ monto: '', metodo_pago: 'efectivo', referencia: '' })
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<any>(null)

  const load = async () => {
    const { data } = await supabase.from('pagos_citas').select('*').eq('cita_id', citaId).order('created_at', { ascending: false })
    setPagos(data || [])
  }

  useEffect(() => { load() }, [citaId])

  const handleSave = async () => {
    if (!tenant || !user) return
    if (!form.monto || parseFloat(form.monto) <= 0) { alert('Ingresa un monto valido'); return }
    setLoading(true)
    await (supabase.from('pagos_citas') as any).insert({
      consultorio_id: tenant.id, cita_id: citaId,
      monto: parseFloat(form.monto), metodo_pago: form.metodo_pago,
      referencia: form.referencia || null, estado: 'pagado',
      fecha_pago: new Date().toISOString(), created_by: user.id,
    })
    setForm({ monto: '', metodo_pago: 'efectivo', referencia: '' })
    setShowForm(false)
    setLoading(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este pago?')) return
    await supabase.from('pagos_citas').delete().eq('id', id)
    load()
  }

  const loadCita = async () => {
    const { data: cita } = await supabase.from('citas').select('*, beneficiario:beneficiarios_expedientes(*)').eq('id', citaId).single()
    return cita
  }

  const totalPagado = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4" /> Pagos
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-primary-600 font-medium px-2 py-1 rounded">
          {showForm ? 'Cancelar' : '+ Registrar'}
        </button>
      </div>

      <div className="bg-clinical-mint rounded-lg p-3 mb-3 flex justify-between items-center">
        <span className="text-xs text-slate-600">Total cobrado</span>
        <span className="text-lg font-bold text-primary-700">{formatMoney(totalPagado)}</span>
      </div>

      {showForm && (
        <div className="bg-slate-50 p-3 rounded-lg mb-3 space-y-2">
          <input type="number" step="0.01" placeholder="Monto"
            value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
            className="w-full p-2 border border-slate-200 rounded text-sm" />
          <select value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})}
            className="w-full p-2 border border-slate-200 rounded text-sm">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
          {form.metodo_pago === 'transferencia' && (
            <input type="text" placeholder="Referencia"
              value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded text-sm" />
          )}
          <button onClick={handleSave} disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar pago'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {pagos.map(p => (
          <div key={p.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg">
            <div className="flex items-center gap-2">
              {p.estado === 'pagado' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
              <div>
                <p className="text-sm font-medium">{formatMoney(Number(p.monto))}</p>
                <p className="text-xs text-slate-500">{p.metodo_pago}{p.referencia && ' - ' + p.referencia}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={async () => { const cita = await loadCita(); setReceipt({ pago: p, cita }) }}
                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Ver recibo">
                <Receipt className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {pagos.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Sin pagos registrados</p>}
      </div>

      {receipt && (
        <PaymentReceipt
          pago={receipt.pago}
          cita={receipt.cita}
          beneficiario={receipt.cita?.beneficiario}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  )
}