import { useState } from 'react'
import { useEffect as useEffectSafe } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { useTheme } from '../context/ThemeContext'
import {
  LogOut, User, Building2, Shield, Sun, Save, Edit2, Palette
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { supabase } from '../lib/supabase'

export function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { tenant, refreshTenant } = useTenant()
  const { theme, setTheme } = useTheme()
  const [showProfile, setShowProfile] = useState(false)
  const [showTenant, setShowTenant] = useState(false)
  const [showThemeEditor, setShowThemeEditor] = useState(false)

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
      {/* Card Usuario */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-700 dark:text-primary-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sesión activa</p>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Card Consultorio - SIN "Plan Pro" */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {tenant?.nombre || 'Cargando...'}
            </p>
            {/* 👇 QUITADO: <p>Plan {tenant?.plan}</p> */}
          </div>
          <button
            onClick={() => setShowTenant(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Card Personalización */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-card overflow-hidden">
        <button
          onClick={() => setShowThemeEditor(true)}
          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm dark:text-slate-300 border-b border-slate-100 dark:border-slate-700"
        >
          <Palette className="w-4 h-4 text-slate-500" />
          <span>Personalizar tema y logo</span>
        </button>

        {/* 👇 SOLO OPCIÓN CLARO */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Tema visual
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
                theme === 'light' || theme === 'auto' || theme === 'dark'
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                  : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-xs font-medium">Claro</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            💡 Por ahora solo tema claro. Modo oscuro/auto se ha desactivado por compatibilidad.
          </p>
        </div>

        <button
          onClick={handleClearCache}
          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm dark:text-slate-300"
        >
          <Shield className="w-4 h-4 text-slate-500" />
          <span>Limpiar cache cifrado local</span>
        </button>

        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3 text-rose-600 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 pt-4">
        <p>DiGest v1.0.0</p>
        <p className="mt-1">PWA Multi-Tenant Segura</p>
      </div>

      {showProfile && (
        <EditProfileModal
          onClose={() => setShowProfile(false)}
          onSaved={refreshTenant}
        />
      )}

      {showTenant && (
        <EditTenantModal
          onClose={() => setShowTenant(false)}
          onSaved={refreshTenant}
        />
      )}

      {showThemeEditor && (
        <ThemeEditorModal
          onClose={() => setShowThemeEditor(false)}
          onSaved={refreshTenant}
        />
      )}
    </div>
  )
}

// ============== MODAL: Editar Perfil ==============
function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const { user } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffectSafe(() => {
    if (!user?.id) return
    ;(supabase.from('perfiles_usuarios') as any)
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }: any) => {
        if (error) {
          setError('No se pudo cargar el perfil')
          return
        }
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
    setError(null)
    const { error } = await (supabase.from('perfiles_usuarios') as any)
      .update({
        nombre_completo: (nombre + ' ' + apellido).trim(),
        telefono,
        cedula_profesional: cedula,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved?.()
    onClose()
  }

  return (
    <Modal onClose={onClose} title="Editar perfil">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-600">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Apellido</label>
            <input
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-600">Teléfono</label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">Cédula profesional</label>
          <input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1">
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============== MODAL: Editar Consultorio ==============
function EditTenantModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const { tenant } = useTenant()
  const [nombre, setNombre] = useState(tenant?.nombre || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!tenant) return
    if (!nombre.trim()) {
      setError('El nombre no puede estar vacío')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await (supabase.from('consultorios') as any)
      .update({
        nombre: nombre.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant.id)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved?.()
    onClose()
  }

  return (
    <Modal onClose={onClose} title="Editar consultorio">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">
            Nombre del consultorio *
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Consultorio Psicológico Aurora"
            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1">
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ============== MODAL: Personalizar Tema y Logo ==============
function ThemeEditorModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const { tenant } = useTenant()
  const [colorPrimario, setColorPrimario] = useState(tenant?.color_primario || '#10b981')
  const [colorSecundario, setColorSecundario] = useState(tenant?.color_secundario || '#0ea5e9')
  const [colorAcento, setColorAcento] = useState(tenant?.color_acento || '#f59e0b')
  const [logoUrl, setLogoUrl] = useState(tenant?.logo_url || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!tenant) return
    setLoading(true)
    setError(null)
    const { error } = await (supabase.from('consultorios') as any)
      .update({
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        color_acento: colorAcento,
        logo_url: logoUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant.id)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved?.()
    onClose()
    // Opcional: recargar para que apliquen los colores globalmente
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <Modal onClose={onClose} title="Personalizar tema y logo">
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Configurá los colores de tu consultorio y subí tu logotipo personalizado.
        </p>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">
            Color primario
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={colorPrimario}
              onChange={(e) => setColorPrimario(e.target.value)}
              className="w-12 h-10 border border-slate-200 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={colorPrimario}
              onChange={(e) => setColorPrimario(e.target.value)}
              className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">
            Color secundario
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={colorSecundario}
              onChange={(e) => setColorSecundario(e.target.value)}
              className="w-12 h-10 border border-slate-200 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={colorSecundario}
              onChange={(e) => setColorSecundario(e.target.value)}
              className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">
            Color de acento
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={colorAcento}
              onChange={(e) => setColorAcento(e.target.value)}
              className="w-12 h-10 border border-slate-200 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={colorAcento}
              onChange={(e) => setColorAcento(e.target.value)}
              className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">
            Logo (URL)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://ejemplo.com/mi-logo.png"
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          {logoUrl && (
            <div className="mt-2 p-2 border border-slate-200 rounded-lg flex items-center gap-2">
              <img
                src={logoUrl}
                alt="Preview"
                className="w-12 h-12 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <span className="text-xs text-slate-500">Vista previa</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1">
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
