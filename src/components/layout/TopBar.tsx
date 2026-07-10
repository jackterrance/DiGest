import { ReactNode } from 'react'
import { useTenant } from '../../context/TenantContext'

interface Props { title: string; subtitle?: string; right?: ReactNode }

export function TopBar({ title, subtitle, right }: Props) {
  const { tenant } = useTenant()
  return (
    <header className="bg-white border-b border-slate-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}