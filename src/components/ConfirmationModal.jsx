import Button from './Button'

export default function ConfirmationModal({ show, onClose, onConfirm, data, loading }) {
    if (!show) return null

    return (
        <div className=\"fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4\">
            < div className =\"bg-white w-full max-w-sm rounded-lg shadow-xl p-6\">
                < h3 className =\"text-lg font-bold text-gray-800 mb-4\">Confirmação</h3>

                    < div className =\"space-y-3 mb-6 bg-gray-50 p-4 rounded text-sm text-gray-700\">
                        < p > <span className=\"font-bold\">Ação:</span> {data.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'}</p>
                            < p > <span className=\"font-bold\">Tipo:</span> {data.subject_type}</p>
                                < p > <span className=\"font-bold\">Identificação:</span> {data.subject_code}</p>
    { data.driver_name && <p><span className=\"font-bold\">Condutor:</span> { data.driver_name }</p >}
    { data.destination && <p><span className=\"font-bold\">Destino:</span> { data.destination }</p >}
    <div className=\"border-t pt-2 mt-2\">
        < p className =\"text-xs text-gray-500\">Registrado por:</p>
            < p className =\"font-bold\">{data.staff_name}</p>
           </div >
        </div >

        <div className=\"flex gap-3\">
            < Button variant =\"secondary\" onClick={onClose} disabled={loading}>Voltar</Button>
                < Button variant =\"primary\" onClick={onConfirm} loading={loading}>Confirmar</Button>
        </div >
      </div >
    </div >
  )
}
