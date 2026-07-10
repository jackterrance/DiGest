import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { useTheme } from '../context/ThemeContext'
import { LogOut, User, Building2, Shield, Camera, Sun, Moon, Monitor, Save, Edit2, Palette } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ThemeEditor } from '../components/settings/ThemeEditor'
import { supabase } from '../lib/supabase'

export function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { tenant } = useTenant()
  const { theme, setTheme } = useTheme()
  const [showProfile, setShowProfile] = useState(false)
  const [showTenant, setShowTenant] = useState(false)
  const [showTheme2, setShowTheme2] = useState(false)
  const fileInputRef = null as any

  const handleSignOut = async () => {
    if (!confirm('Cerrar sesion?')) return
    await signOut()
  }

  const handleClearCache = () => {
    if (!confirm('Borrar datos cifrados locales?')) return
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('enc_') || k === 'psi-secure-salt') localStorage.removeItem(k)
    })
    alert('Cache cifrado limpiado')
  }

  return (
    <div className="p-3 space-y-3">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-700 dark:text-primary-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sesion activa</p>
          </div>
          <button onClick={() => setShowProfile(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <Edit2 className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-clinical-mint dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-800 dark:text-slate-100">{tenant?.nombre || 'Cargando...'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">Plan {tenant?.plan || '-'}</p>
          </div>
          <button onClick={() => setShowTenant(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <Edit2 className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-card overflow-hidden">
        <button onClick={() => setShowTheme2(true)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
          <Palette className="w-4 h-4 text-slate-500" />
          <span>Personalizar tema y logo</span>
        </button>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tema visual</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'light', icon: Sun,     label: 'Claro'  },
              { v: 'dark',  icon: Moon,    label: 'Oscuro' },
              { v: 'auto',  icon: Monitor, label: 'Auto'   },
            ] as const).map(({ v, icon: Icon, label }) => (
              <button key={v} onClick={() => setTheme(v as any)}
                className={'flex flex-col items-center py-2 rounded-lg transition ' + (
                  theme === v ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                )}>
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleClearCache}
          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm dark:text-slate-300">
          <Shield className="w-4 h-4 text-slate-500" />
          <span>Limpiar cache cifrado local</span>
        </button>
        <button onClick={handleSignOut}
          className="w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3 text-rose-600 text-sm">
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesion</span>
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 pt-4">
        <p>DiGest v1.0.0</p>
        <p className="mt-1">PWA Multi-Tenant Segura</p>
      </div>

      {showProfile && <EditProfileModal onClose={() => setShowProfile(false)} />}
      {showTenant && <EditTenantModal onClose={() => setShowTenant(false)} />}
      {showTheme2 && <ThemeEditor onClose={() => setShowTheme2(false)} />}
    </div>
  )
}

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)

  useEffectSafe(() => {
    // Si el usuario no ha cargado o no existe el ID, no ejecutamos la consulta
    if (!user?.id) return

    (supabase.from('perfiles_usuarios') as any).select('*').eq('id', user.id).single()
      .then(({ data }: any) => {
        if (data) {
          const parts = (data.nombre_completo || '').split(' ')
          setNombre(parts[0] || '')
          setApellido(parts.slice(1).join(' ') || '')
          setTelefono(data.telefono || '')
          setCedula(data.cedula_profesional || '')
        }
      })
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    await (supabase.from('perfiles_usuarios') as any).update({
      nombre_completo: (nombre + ' ' + apellido).trim(),
      telefono,
      cedula_profesional: cedula,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    setLoading(false)
    onClose()
  }

  return (
    <Modal onClose={onClose} title="Editar perfil">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600">Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Apellido</label>
            <input value={apellido} onChange={e => setApellido(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-600">Telefono</label>
          <input value={telefono} onChange={e => setTelefono(e.target.value)}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-600">Cedula profesional</label>
          <input value={cedula} onChange={e => setCedula(e.target.value)}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1">
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditTenantModal({ onClose }: { onClose: () => void }) {
  const { tenant } = useTenant()
  const [nombre, setNombre] = useState(tenant?.nombre || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!tenant) return
    setLoading(true)
    await (supabase.from('consultorios') as any).update({ nombre, updated_at: new Date().toISOString() }).eq('id', tenant.id)
    setLoading(false)
    onClose()
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <Modal onClose={onClose} title="Editar consultorio">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-600">Nombre del consultorio</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1">
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Hook helper para evitar import extra
import { useEffect as useEffectSafe } from 'react'