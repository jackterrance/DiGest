import { useState } from 'react'
import { Search, UserPlus, Phone, Calendar } from 'lucide-react'
import { useBeneficiaries } from '../../hooks/useBeneficiaries'
import { BeneficiaryForm } from './BeneficiaryForm'
import { BeneficiaryDetail } from './BeneficiaryDetail'
import { Spinner } from '../ui/Spinner'

type FiltroEstado = 'todos' | 'activo' | 'inactivo'

export function BeneficiaryList() {
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const { items, loading, stats } = useBeneficiaries(search, filtro)

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-center">
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.activos}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Activos</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-center">
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{stats.inactivos}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Inactivos</p>
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-2 text-center">
          <p className="text-xl font-bold text-primary-700 dark:text-primary-300">{stats.total}</p>
          <p className="text-[10px] text-primary-600 dark:text-primary-400">Total</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
      </div>

      <div className="flex gap-2">
        {(['todos', 'activo', 'inactivo'] as FiltroEstado[]).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={'flex-1 py-1.5 rounded-full text-xs font-medium transition ' + (
              filtro === f ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            )}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <button onClick={() => setShowForm(true)}
        className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition">
        <UserPlus className="w-4 h-4" /> Nuevo expediente
      </button>

      {loading ? <Spinner /> : items.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">
          {search ? 'Sin resultados' : 'Crea el primer expediente'}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map(b => (
            <button key={b.id} onClick={() => setSelected(b.id)}
              className="w-full text-left bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-card hover:border-primary-200 active:scale-[0.98] transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{b.nombre_completo}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Exp. {b.codigo_expediente}
                    {b.telefono && <span className="ml-2 inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{b.telefono}</span>}
                  </p>
                  {b.total_citas !== undefined && (
                    <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-1 inline-flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" /> {b.total_citas} cita{b.total_citas !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (
                  b.estado === 'activo' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' :
                  b.estado === 'alta' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                  b.estado === 'baja' ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' :
                  'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                )}>
                  {b.estado}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && <BeneficiaryForm onClose={() => setShowForm(false)} />}
      {selected && <BeneficiaryDetail id={selected} onClose={() => setSelected(null)} onChanged={() => setSelected(null)} />}
    </div>
  )
}