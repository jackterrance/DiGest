import { useState } from 'react'
import { Plus } from 'lucide-react'
import { InventoryList } from '../components/inventory/InventoryList'
import { InventoryForm } from '../components/inventory/InventoryForm'
import type { InventarioItem } from '../types/database'

export function InventoryScreen() {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<InventarioItem | null>(null)

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-white border-b border-slate-100">
        <button onClick={() => { setEditItem(null); setShowForm(true) }}
          className="w-full bg-primary-600 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <InventoryList onEdit={(item) => { setEditItem(item); setShowForm(true) }} />
      </div>
      {showForm && (
        <InventoryForm item={editItem}
          onClose={() => { setShowForm(false); setEditItem(null) }} />
      )}
    </div>
  )
}