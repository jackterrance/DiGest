import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import { ConsultorioThemeProvider } from './context/ConsultorioTheme'
import { ThemeProvider } from './context/ThemeContext'
import { LoginScreen } from './screens/LoginScreen'
import { BeneficiariesScreen } from './screens/BeneficiariesScreen'
import { InventoryScreen } from './screens/InventoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { MobileShell } from './components/layout/MobileShell'
import { Spinner } from './components/ui/Spinner'

// Importamos las nuevas páginas funcionales
import CalendarPage from './pages/CalendarPage'
import { ReportsScreen } from './pages/ReportsPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>
  if (!session) return <Navigate to="/login" replace />
  return (
    <TenantProvider>
      <ConsultorioThemeProvider>
        {children}
      </ConsultorioThemeProvider>
    </TenantProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/" element={<Protected><MobileShell /></Protected>}>
              <Route index element={<Navigate to="/calendario" replace />} />
              {/* Cambiado por el componente con lógica de calendario */}
              <Route path="calendario"    element={<CalendarPage />} />
              <Route path="beneficiarios" element={<BeneficiariesScreen />} />
              <Route path="inventario"    element={<InventoryScreen />} />
              {/* Nueva ruta de analíticas e ingresos */}
              <Route path="reportes"      element={<ReportsScreen/>} />
              <Route path="configuracion" element={<SettingsScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}