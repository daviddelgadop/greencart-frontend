import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { http } from '../lib/api'

export default function ForgotPassword() {
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const uid = params.get('uid')
  const token = params.get('token')

  const isConfirmMode = useMemo(() => Boolean(uid && token), [uid, token])

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      await http.post('/api/auth/password-reset/', { email })
      setSuccess("Si l'email existe, un lien de réinitialisation a été envoyé.")
    } catch (err: any) {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    try {
      await http.post('/api/auth/password-reset/confirm/', {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setSuccess('Mot de passe modifié avec succès. Vous pouvez vous connecter.')
      // Navigate to login after a short delay
      setTimeout(() => navigate('/login'), 1200)
    } catch (err: any) {
      // Try to show specific errors if provided
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string' && detail.toLowerCase().includes('token')) {
        setError('Lien invalide ou expiré. Veuillez refaire la demande de réinitialisation.')
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <img src="/images/logo_min_circle.png" alt="GreenCart logo" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-dark-green">
              {isConfirmMode ? 'Nouveau mot de passe' : 'Réinitialiser le mot de passe'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isConfirmMode
                ? 'Définissez votre nouveau mot de passe.'
                : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {!isConfirmMode ? (
            <form onSubmit={handleRequest} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                    placeholder="votre@email.fr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-dark-green text-pale-yellow py-3 rounded-lg font-semibold hover:bg-dark-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-3 w-5 h-5 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 w-5 h-5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-dark-green text-pale-yellow py-3 rounded-lg font-semibold hover:bg-dark-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
