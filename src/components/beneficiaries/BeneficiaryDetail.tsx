import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { Trash2, Phone, Mail, MapPin, Calendar, FileText, Edit2, Save, X, Upload, Briefcase } from 'lucide-react'
import { formatDate } from '../../utils/formatters'
import { FileUploader } from './FileUploader'
import { FileList } from './FileList'

interface Props { id: string; onClose: () => void; onChanged: () => void }

export function BeneficiaryDetail({ id, onClose, onChanged }: Props) {
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [notas, setNotas] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const [refreshFiles, setRefreshFiles] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await (supabase.from('beneficiarios_expedientes') as any).select('*').eq('id', id).single()
    if (data) {
      setItem(data)
      setNotas(data.notas_clinicas || '')
      setFormData(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!confirm('Eliminar este expediente? Se eliminaran citas, pagos y archivos.')) return
    const { data: files } = await supabase.storage.from('expedientes-archivos').list(item.consultorio_id + '/' + id)
    if (files && files.length > 0) {
      const paths = files.map(f => item.consultorio_id + '/' + id + '/' + f.name)
      await supabase.storage.from('expedientes-archivos').remove(paths)
    }
    await (supabase.from('beneficiarios_expedientes') as any).delete().eq('id', id)
    onChanged()
    onClose()
  }

  const handleSaveNotas = async () => {
    await (supabase.from('beneficiarios_expedientes') as any).update({
      notas_clinicas: notas, updated_at: new Date().toISOString()
    }).eq('id', id)
    setEditing(false)
    load()
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    // Limpiar campos vacios
    const payload = {
      ...formData,
      fecha_nacimiento: formData.fecha_nacimiento || null,
      genero: formData.genero || null,
      telefono: formData.telefono || null,
      email: formData.email || null,
      direccion: formData.direccion || null,
      motivo_consulta: formData.motivo_consulta || null,
      contacto_emergencia_nombre: formData.contacto_emergencia_nombre || null,
      contacto_emergencia_telefono: formData.contacto_emergencia_telefono || null,
      contacto_emergencia_parentesco: formData.contacto_emergencia_parentesco || null,
      updated_at: new Date().toISOString()
    }
    await (supabase.from('beneficiarios_expedientes') as any).update(payload).eq('id', id)
    setSaving(false)
    setEditing(false)
    onChanged()
    load()
  }

  const handleClose = () => { onChanged(); onClose() }

  if (loading) return <Modal onClose={onClose} title="Cargando..."><p className="text-center py-8">...</p></Modal>
  if (!item) return <Modal onClose={onClose} title="Error"><p>No encontrado</p></Modal>

  return (
    <Modal onClose={handleClose} title={'Expediente ' + item.codigo_expediente}>
      <div className="space-y-4">
        {editing ? (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-600">Codigo</label>
                <input value={formData.codigo_expediente || ''} onChange={e => setFormData({...formData, codigo_expediente: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Estado</label>
                <select value={formData.estado || 'activo'} onChange={e => setFormData({...formData, estado: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="alta">Alta</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600">Nombre completo</label>
              <input value={formData.nombre_completo || ''} onChange={e => setFormData({...formData, nombre_completo: e.target.value})}
                className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-600">F. Nacimiento</label>
                <input type="date" value={formData.fecha_nacimiento || ''} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Genero</label>
                <select value={formData.genero || ''} onChange={e => setFormData({...formData, genero: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm">
                  <option value="">-</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero_no_decir">Prefiero no decir</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-600">Telefono</label>
                <input value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600">Direccion</label>
              <input value={formData.direccion || ''} onChange={e => setFormData({...formData, direccion: e.target.value})}
                className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-600">Motivo de consulta</label>
              <textarea value={formData.motivo_consulta || ''} onChange={e => setFormData({...formData, motivo_consulta: e.target.value})}
                rows={2} className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
            </div>
            <div className="border-t border-primary-200 pt-2 mt-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">CONTACTO DE EMERGENCIA</p>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Nombre" value={formData.contacto_emergencia_nombre || ''} onChange={e => setFormData({...formData, contacto_emergencia_nombre: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
                <input placeholder="Parentesco" value={formData.contacto_emergencia_parentesco || ''} onChange={e => setFormData({...formData, contacto_emergencia_parentesco: e.target.value})}
                  className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm" />
              </div>
              <input placeholder="Telefono" value={formData.contacto_emergencia_telefono || ''} onChange={e => setFormData({...formData, contacto_emergencia_telefono: e.target.value})}
                className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded text-sm mt-2" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => { setEditing(false); setFormData(item) }} className="flex-1">
                <X className="w-4 h-4" /> Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveEdit} loading={saving} className="flex-1">
                <Save className="w-4 h-4" /> Guardar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{item.nombre_completo}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Estado: <span className="font-medium text-primary-700 dark:text-primary-300">{item.estado}</span></p>
                </div>
                <button onClick={() => setEditing(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" title="Editar">
                  <Edit2 className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              {item.fecha_nacimiento && (
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400" /> Nacido: {formatDate(item.fecha_nacimiento)}
                </p>
              )}
              {item.telefono && (
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone className="w-4 h-4 text-slate-400" /> {item.telefono}</p>
              )}
              {item.email && (
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Mail className="w-4 h-4 text-slate-400" /> {item.email}</p>
              )}
              {item.direccion && (
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><MapPin className="w-4 h-4 text-slate-400" /> {item.direccion}</p>
              )}
              {(item.contacto_emergencia_nombre || item.contacto_emergencia_telefono) && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{item.contacto_emergencia_nombre}</span>
                    {item.contacto_emergencia_parentesco && <span className="text-xs text-slate-500">({item.contacto_emergencia_parentesco})</span>}
                  </p>
                  {item.contacto_emergencia_telefono && (
                    <p className="text-xs text-slate-500 ml-6">{item.contacto_emergencia_telefono}</p>
                  )}
                </div>
              )}
            </div>

            {item.motivo_consulta && (
              <div className="bg-clinical-mint dark:bg-emerald-900/30 p-3 rounded-lg">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">MOTIVO DE CONSULTA</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{item.motivo_consulta}</p>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <FileText className="w-3 h-3" /> NOTAS CLINICAS (CONFIDENCIAL)
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap mt-1">
                {item.notas_clinicas || <span className="text-slate-400 italic">Sin notas</span>}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Archivos adjuntos</p>
                <button onClick={() => setShowUploader(!showUploader)} className="text-xs bg-primary-600 text-white px-2 py-1 rounded font-medium flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Subir
                </button>
              </div>

              {showUploader && (
                <div className="mb-3">
                  <FileUploader
                    beneficiarioId={id}
                    onUploaded={() => { setRefreshFiles(refreshFiles + 1); onChanged() }}
                    onClose={() => setShowUploader(false)}
                  />
                </div>
              )}

              <FileList beneficiarioId={id} refreshKey={refreshFiles} />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button variant="danger" onClick={handleDelete} className="w-full">
                <Trash2 className="w-4 h-4" /> Eliminar expediente completo
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}