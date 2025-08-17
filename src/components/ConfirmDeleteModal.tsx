type ConfirmDeleteModalProps = {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  message?: string
}

export default function ConfirmDeleteModal({
  visible,
  onConfirm,
  onCancel,
  title = "Confirmation",
  message = "Êtes-vous sûr de vouloir supprimer cet élément ?"
}: ConfirmDeleteModalProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-lg font-semibold text-dark-green mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
