import { useTenant } from '../../context/TenantContext'
import { formatMoney, formatDate } from '../../utils/formatters'
import { dayjs } from '../../utils/dates'
import { X, Share2, Printer } from 'lucide-react'

interface Props {
  pago: any
  cita: any
  beneficiario: any
  onClose: () => void
}

export function PaymentReceipt({ pago, cita, beneficiario, onClose }: Props) {
  const { tenant } = useTenant()
  const folio = 'REC-' + dayjs().format('YYYYMMDD') + '-' + pago.id.slice(0, 6).toUpperCase()
  const fechaEmision = dayjs().format('DD/MM/YYYY HH:mm')

  const generarTexto = () => {
    return '=== RECIBO DE PAGO ===\n\n' +
      'Folio: ' + folio + '\n' +
      'Fecha: ' + fechaEmision + '\n\n' +
      'CONSULTORIO\n' +
      (tenant?.nombre || '') + '\n\n' +
      'PACIENTE\n' +
      (beneficiario?.nombre_completo || '') + '\n' +
      'Exp. ' + (beneficiario?.codigo_expediente || '') + '\n\n' +
      'SERVICIO\n' +
      'Sesion del ' + formatDate(cita?.fecha) + '\n' +
      'Horario: ' + cita?.hora_inicio?.slice(0,5) + ' - ' + cita?.hora_fin?.slice(0,5) + '\n' +
      'Tipo: ' + cita?.tipo_sesion + ' (' + cita?.modalidad + ')\n\n' +
      'PAGO\n' +
      'Monto: ' + formatMoney(Number(pago.monto)) + '\n' +
      'Metodo: ' + pago.metodo_pago + '\n' +
      (pago.referencia ? 'Referencia: ' + pago.referencia + '\n' : '') +
      'Estado: ' + pago.estado + '\n\n' +
      'Gracias por su preferencia.'
  }

  const handleShare = async () => {
    const texto = generarTexto()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Recibo de pago', text: texto })
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(texto)
      alert('Recibo copiado al portapapeles')
    }
  }

  const handlePrint = () => {
    const texto = generarTexto()
    const w = window.open('', '_blank')
    if (w) {
      w.document.write('<html><head><title>Recibo</title><style>body{font-family:monospace;padding:20px;white-space:pre-wrap;}</style></head><body>' + texto + '</body></html>')
      w.document.close()
      w.print()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-slate-800">Recibo de Pago</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
            <p className="text-xs uppercase text-slate-500">RECIBO</p>
            <p className="text-2xl font-bold text-primary-700">{formatMoney(Number(pago.monto))}</p>
            <p className="text-xs text-slate-500 mt-1">Folio: {folio}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Consultorio</p>
              <p className="font-medium">{tenant?.nombre || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Paciente</p>
              <p className="font-medium">{beneficiario?.nombre_completo || '-'}</p>
              <p className="text-xs text-slate-500">Exp. {beneficiario?.codigo_expediente || '-'}</p>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-3">
              <p className="text-xs text-slate-500">Servicio</p>
              <p className="font-medium">Sesion del {formatDate(cita?.fecha)}</p>
              <p className="text-xs text-slate-500">Horario: {cita?.hora_inicio?.slice(0,5)} - {cita?.hora_fin?.slice(0,5)}</p>
              <p className="text-xs text-slate-500">Tipo: {cita?.tipo_sesion} ({cita?.modalidad})</p>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-3">
              <div className="flex justify-between"><span className="text-slate-500">Metodo:</span><span className="font-medium capitalize">{pago.metodo_pago}</span></div>
              {pago.referencia && <div className="flex justify-between"><span className="text-slate-500">Referencia:</span><span className="font-medium">{pago.referencia}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Estado:</span><span className="font-medium capitalize text-emerald-600">{pago.estado}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fecha pago:</span><span className="font-medium">{formatDate(pago.fecha_pago)}</span></div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={handleShare} className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Compartir
            </button>
            <button onClick={handlePrint} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">Emitido: {fechaEmision}</p>
        </div>
      </div>
    </div>
  )
}