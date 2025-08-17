import React, { useRef, useEffect } from 'react'

interface Props {
  visible: boolean
  onClose: () => void
  onConfirm: (password: string) => void
}

export default function PasswordConfirmModal({ visible, onClose, onConfirm }: Props) {
  const [password, setPassword] = React.useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-sm animate-fade-in">
        <div className="text-center">
          <h2 className="text-xl font-bold text-dark-green mb-2">Confirmation requise</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Veuillez entrer votre mot de passe pour confirmer.
          </p>
        </div>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-dark-green"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-red-500 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(password)}
            className="px-4 py-2 bg-dark-green text-pale-yellow rounded-lg font-semibold hover:bg-dark-green/90"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}
