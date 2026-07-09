import { useAuth } from '../context/AuthContext'
import { LogOut, User } from 'lucide-react'

export function DashboardScreen() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{user?.email}</p>
              <p className="text-xs text-slate-500">Sesion activa</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-card text-center">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Login exitoso</h2>
          <p className="text-sm text-slate-600">
            Has iniciado sesion correctamente. Ahora podemos seguir construyendo el resto de las pantallas.
          </p>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-rose-50 text-rose-600 py-2.5 rounded-xl font-medium text-sm hover:bg-rose-100 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesion
        </button>
      </div>
    </div>
  )
}