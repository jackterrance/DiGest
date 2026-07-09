import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../context/TenantContext'
import { dayjs } from '../utils/dates'

const STORAGE_KEY = 'psi-push-enabled'

export function useNotifications() {
  const { tenant } = useTenant()
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [citasHoy, setCitasHoy] = useState<any[]>([])

  // Cargar citas del día
  const loadCitasHoy = useCallback(async () => {
    if (!tenant) return
    const hoy = dayjs().format('YYYY-MM-DD')
    const { data } = await supabase
      .from('citas')
      .select('*, beneficiario:beneficiarios_expedientes(nombre_completo, codigo_expediente)')
      .eq('consultorio_id', tenant.id)
      .eq('fecha', hoy)
      .order('hora_inicio')
    setCitasHoy(data || [])
  }, [tenant])

  useEffect(() => {
    loadCitasHoy()
    // Recargar cada 5 minutos
    const interval = setInterval(loadCitasHoy, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadCitasHoy])

  // Mostrar notificacion del navegador
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return
    try {
      new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options
      })
    } catch (e) {
      console.warn('No se pudo mostrar notificacion:', e)
    }
  }, [permission])

  // Verificar citas proximas y notificar
  useEffect(() => {
    if (!enabled || permission !== 'granted') return

    const interval = setInterval(() => {
      const ahora = dayjs()
      citasHoy.forEach(cita => {
        if (cita.estado !== 'agendada') return
        const [h, m] = cita.hora_inicio.split(':').map(Number)
        const horaCita = dayjs().hour(h).minute(m)
        const diffMin = horaCita.diff(ahora, 'minute')

        // Notificar 30 min antes y 5 min antes
        if ((diffMin === 30 || diffMin === 5) && !sessionStorage.getItem('notif-' + cita.id + '-' + diffMin)) {
          sessionStorage.setItem('notif-' + cita.id + '-' + diffMin, '1')
          showNotification(
            'Cita en ' + diffMin + ' minutos',
            {
              body: cita.beneficiario?.nombre_completo + ' - ' + cita.hora_inicio.slice(0, 5) + ' (' + cita.modalidad + ')',
              tag: 'cita-' + cita.id,
              requireInteraction: diffMin <= 5
            }
          )
        }
      })
    }, 60 * 1000) // Cada minuto

    return () => clearInterval(interval)
  }, [enabled, permission, citasHoy, showNotification])

  // Notificar al inicio del dia si hay citas
  useEffect(() => {
    if (!enabled || permission !== 'granted' || citasHoy.length === 0) return
    const notifId = 'morning-' + dayjs().format('YYYY-MM-DD')
    if (sessionStorage.getItem(notifId)) return
    sessionStorage.setItem(notifId, '1')
    showNotification(
      'Tienes ' + citasHoy.length + ' cita(s) hoy',
      {
        body: 'Revisa tu agenda para ver los detalles',
        tag: notifId
      }
    )
  }, [enabled, permission, citasHoy, showNotification])

  // Solicitar permiso
  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Tu navegador no soporta notificaciones')
      return false
    }
    if (Notification.permission === 'granted') {
      setPermission('granted')
      return true
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  // Activar/desactivar
  const toggle = async () => {
    if (!enabled) {
      const granted = permission === 'granted' || await requestPermission()
      if (granted) {
        localStorage.setItem(STORAGE_KEY, 'true')
        setEnabled(true)
        showNotification('Notificaciones activadas', { body: 'Recibiras avisos de tus citas' })
      }
    } else {
      localStorage.setItem(STORAGE_KEY, 'false')
      setEnabled(false)
    }
  }

  return { enabled, permission, toggle, citasHoy, showNotification, requestPermission }
}