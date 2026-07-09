import { InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> { 
  label?: string 
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, className = '', ...rest }, ref) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input 
      ref={ref} 
      {...rest}
      className={`w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 ${className}`} 
    />
  </div>
))