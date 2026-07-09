import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Trash2, Download, Image as ImageIcon, FileText, File, X, ZoomIn } from 'lucide-react'
import { getFileIcon, formatFileSize } from './FileUploader'
import { formatDate } from '../../utils/formatters'

interface Props {
  beneficiarioId: string
  refreshKey: number
}

const categoriaColors: Record<string, string> = {
  nota_sesion: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-100 dark:border-blue-900',
  clinico: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-100 dark:border-rose-900',
  foto: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-100 dark:border-purple-900',
  documento: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-100 dark:border-amber-900',
  otro: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
}

// Helper para colorear el contenedor del icono de acuerdo al tipo MIME
const getIconColorClass = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
  if (mimeType.includes('pdf')) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
  if (mimeType.includes('word') || mimeType.includes('msword')) return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
  return 'text-slate-500 bg-slate-50 dark:bg-slate-800'
}

export function FileList({ beneficiarioId, refreshKey }: Props) {
  const [archivos, setArchivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<{ url: string; nombre: string } | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('expediente_archivos')
      .select('*')
      .eq('beneficiario_id', beneficiarioId)
      .order('created_at', { ascending: false })
    setArchivos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [beneficiarioId, refreshKey])

  const handleDownload = async (archivo: any) => {
    const { data } = await supabase.storage
      .from('expedientes-archivos')
      .createSignedUrl(archivo.storage_path, 60)
    if (data?.signedUrl) {
      if (archivo.mime_type.startsWith('image/')) {
        setPreview({ url: data.signedUrl, nombre: archivo.nombre_archivo })
      } else {
        const a = document.createElement('a')
        a.href = data.signedUrl
        a.download = archivo.nombre_archivo
        a.click()
      }
    }
  }

  const handleDelete = async (archivo: any) => {
    if (!confirm('¿Eliminar "' + archivo.nombre_archivo + '"?')) return
    await supabase.storage.from('expedientes-archivos').remove([archivo.storage_path])
    await supabase.from('expediente_archivos').delete().eq('id', archivo.id)
    load()
  }

  if (loading) return <p className="text-xs text-slate-400 text-center py-4">Cargando archivos...</p>
  if (archivos.length === 0) return <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">Sin archivos adjuntos en este expediente</p>

  return (
    <>
      {/* Contenedor con altura máxima controlada y scroll estilizado */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
        {archivos.map(a => {
          const Icon = getFileIcon(a.mime_type)
          const isImage = a.mime_type.startsWith('image/')
          const iconTheme = getIconColorClass(a.mime_type)
          
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition min-w-0">
              
              {/* Contenedor del Icono Dinámico */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-transparent ${iconTheme}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Información del archivo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate" title={a.nombre_archivo}>
                  {a.nombre_archivo}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-medium tracking-wide ${categoriaColors[a.categoria] || ''}`}>
                    {a.categoria?.replace('_', ' ')}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(a.tamano_bytes || 0)}</span>
                  <span>•</span>
                  <span>{formatDate(a.created_at)}</span>
                </div>
                {a.descripcion && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100/50 dark:border-slate-800">
                    {a.descripcion}
                  </p>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {isImage && (
                  <button onClick={() => handleDownload(a)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition" title="Ver imagen">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleDownload(a)} className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition" title="Descargar">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(a)} className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Vista Previa de Imágenes */}
      {preview && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 p-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition shadow-md">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img src={preview.url} alt={preview.nombre} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-slate-800" onClick={e => e.stopPropagation()} />
            <p className="text-slate-300 text-xs font-medium mt-3 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 max-w-xs truncate">{preview.nombre}</p>
          </div>
        </div>
      )}
    </>
  )
}