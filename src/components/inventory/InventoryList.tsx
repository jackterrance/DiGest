import { AlertTriangle, Package } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { Spinner } from '../ui/Spinner'
import { formatMoney } from '../../utils/formatters'
import type { InventarioItem } from '../../types/database'

export function InventoryList({ onEdit }: { onEdit: (item: InventarioItem) => void }) {
  const { items, loading, adjustStock } = useInventory()

  if (loading) return <Spinner />

  return (
    <div className="p-3 space-y-2">
      {items.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">Sin suministros. Agrega el primer producto.</p>
      ) : (
        items.map(item => {
          const isLow = item.stock_actual <= item.stock_minimo
          return (
            <div key={item.id} onClick={() => onEdit(item)}
              className={'bg-white rounded-xl p-3 border shadow-card cursor-pointer ' + (
                isLow ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'
              )}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-500" />
                    <p className="font-medium text-slate-800 text-sm">{item.nombre}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.categoria} - {item.unidad_medida}
                    {item.precio_unitario && item.precio_unitario > 0 && ' - ' + formatMoney(item.precio_unitario)}
                  </p>
                </div>
                {isLow && (
                  <div className="flex items-center gap-1 text-rose-600 text-xs font-medium bg-rose-100 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Stock bajo
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); adjustStock(item.id, -1) }}
                    className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full font-bold">-</button>
                  <span className="text-lg font-bold w-12 text-center">{item.stock_actual}</span>
                  <button onClick={(e) => { e.stopPropagation(); adjustStock(item.id, +1) }}
                    className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full font-bold">+</button>
                </div>
                <span className="text-xs text-slate-500">Min: {item.stock_minimo}</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}