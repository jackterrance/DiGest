// Tipos de la base de datos. Más adelante puedes regenerarlos
// con: pnpm dlx supabase gen types typescript --project-id TU_ID

export interface Consultorio {
  id: string
  nombre: string
  slug?: string
  plan?: string
  activo?: boolean
  color_primario?: string      // 👈 AGREGAR
  color_secundario?: string    // 👈 AGREGAR
  color_acento?: string        // 👈 AGREGAR
  logo_url?: string | null     // 👈 AGREGAR
  created_at?: string
  updated_at?: string
}


export interface PerfilUsuario {
  id: string
  consultorio_id: string
  nombre_completo: string
  cedula_profesional: string | null
  rol: 'admin' | 'psicologo' | 'asistente'
  telefono: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Beneficiario {
  id: string
  consultorio_id: string
  codigo_expediente: string
  nombre_completo: string
  fecha_nacimiento: string | null
  genero: 'M' | 'F' | 'Otro' | 'Prefiero_no_decir' | null
  telefono: string | null
  email: string | null
  direccion: string | null
  motivo_consulta: string | null
  notas_clinicas: string | null
  estado: 'activo' | 'inactivo' | 'alta' | 'baja'
  created_at: string
  updated_at: string
}

export interface Cita {
  id: string
  consultorio_id: string
  beneficiario_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  tipo_sesion: 'individual' | 'pareja' | 'familiar' | 'evaluacion'
  modalidad: 'presencial' | 'online'
  estado: 'agendada' | 'completada' | 'cancelada' | 'reagendada' | 'no_asistio'
  notas: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Pago {
  id: string
  consultorio_id: string
  cita_id: string
  monto: number
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'
  estado: 'pendiente' | 'pagado' | 'reembolsado' | 'cancelado'
  fecha_pago: string | null
  referencia: string | null
  notas: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InventarioItem {
  id: string
  consultorio_id: string
  nombre: string
  categoria: 'papeleria' | 'material_clinico' | 'pruebas' | 'limpieza' | 'otro' | null
  unidad_medida: string
  stock_actual: number
  stock_minimo: number
  precio_unitario: number | null
  proveedor: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      consultorios:             { Row: Consultorio;    Insert: Partial<Consultorio>;    Update: Partial<Consultorio> }
      perfiles_usuarios:        { Row: PerfilUsuario;  Insert: Partial<PerfilUsuario>;  Update: Partial<PerfilUsuario> }
      beneficiarios_expedientes:{ Row: Beneficiario;   Insert: Partial<Beneficiario>;   Update: Partial<Beneficiario> }
      citas:                    { Row: Cita;           Insert: Partial<Cita>;           Update: Partial<Cita> }
      pagos_citas:              { Row: Pago;           Insert: Partial<Pago>;           Update: Partial<Pago> }
      inventario_suministros:   { Row: InventarioItem; Insert: Partial<InventarioItem>; Update: Partial<InventarioItem> }
    }
  }
}
