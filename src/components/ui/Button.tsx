import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

const styles: Record<Variant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-300',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  danger:    'bg-rose-50 text-rose-600 hover:bg-rose-100',
  ghost:     'text-slate-600 hover:bg-slate-100',
}

export function Button({ variant = 'primary', loading, children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition active:scale-95 disabled:cursor-not-allowed ' + styles[variant] + ' ' + className}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  )
}