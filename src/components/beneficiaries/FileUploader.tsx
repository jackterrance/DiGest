import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantContext'
import { useAuth } from '../../context/AuthContext'
import { Upload, X, FileText, Image as ImageIcon, Loader2, File } from 'lucide-react'

interface Props {
  beneficiarioId: string
  onUploaded: () => void
  onClose: () => void
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function FileUploader({ beneficiarioId, onUploaded, onClose }: Props) {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categoria, setCategoria] = useState<'nota_sesion' | 'clinico' | 'foto' | 'documento' | 'otro'>('nota_sesion')
  const [descripcion, setDescripcion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!tenant) { setError('No hay consultorio activo'); return }

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > MAX_SIZE) {
          setError('"' + file.name + '" excede 10MB')
          continue
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
        const storagePath = tenant.id + '/' + beneficiarioId + '/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_')

        const { error: upErr } = await supabase.storage
          .from('expedientes-archivos')
          .upload(storagePath, file, { contentType: file.type, upsert: false })

        if (upErr) { setError('Error: ' + upErr.message); continue }

        await (supabase.from('expediente_archivos') as any).insert({
          consultorio_id: tenant.id,
          beneficiario_id: beneficiarioId,
          nombre_archivo: file.name,
          tipo_archivo: ext,
          categoria,
          mime_type: file.type || 'application/octet-stream',
          tamano_bytes: file.size,
          storage_path: storagePath,
          descripcion: descripcion || null,
          subido_por: user?.id,
        })

        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
      onUploaded()
      onClose()
    } catch (e: any) {
      setError('Error: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-600 mb-1 block">Categoria del archivo</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value as any)}
          className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm">
          <option value="nota_sesion">Nota de sesion</option>
          <option value="clinico">Documento clinico</option>
          <option value="foto">Foto</option>
          <option value="documento">Documento general</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-600 mb-1 block">Descripcion (opcional)</label>
        <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder="Ej. Sesion del 15 de enero"
          className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition">
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Toca para seleccionar archivos</p>
        <p className="text-xs text-slate-500 mt-1">PDF, Word, JPG, PNG (max 10MB)</p>
        <input ref={fileInputRef} type="file" multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
          onChange={e => handleFiles(e.target.files)} className="hidden" />
      </div>

      {uploading && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Subiendo... {progress}%</span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 mt-2">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: progress + '%' }}></div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm">{error}</div>
      )}
    </div>
  )
}

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.includes('pdf')) return FileText
  return File
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}