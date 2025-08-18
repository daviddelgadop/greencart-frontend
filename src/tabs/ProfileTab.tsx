import React, { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { http } from '../lib/api'

interface Props {
  onShowPasswordConfirm: () => void
  password?: string
  onPasswordValidated?: () => void
  active: boolean
}

export default function ProfileTab({ onShowPasswordConfirm, password, onPasswordValidated, active }: Props) {
  const { user, setUser } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [publicName, setPublicName] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [mainAddress, setMainAddress] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [experience, setExperience] = useState('')
  const [passwordChecked, setPasswordChecked] = useState(false)

  const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

  const resolveMediaUrl = (u?: string | null, bustCache = true): string | null => {
    if (!u) return null
    if (u.startsWith('blob:')) return u
    if (/^https?:\/\//i.test(u)) return u
    const abs = `${API_BASE}/${u.replace(/^\/+/, '')}`
    return bustCache ? `${abs}?v=${Date.now()}` : abs
  }

  useEffect(() => {
    if (!user) return
    setFirstName(user.first_name || '')
    setLastName(user.last_name || '')
    setEmail(user.email || '')
    setPhone(user.phone || '')
    setDateOfBirth(user.date_of_birth?.slice(0, 10) || '')
    setPublicName(user.public_display_name || '')
    setDescription(user.description_utilisateur || '')
    setExperience(user.years_of_experience?.toString() || '')
    setAvatarUrl(resolveMediaUrl(user.avatar))
  }, [user])

  useEffect(() => {
    if (password && !passwordChecked && active) {
      void verifyPassword(password)
    }
  }, [password, passwordChecked, active])

  const formatPhoneFR = (v: string) => v.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  const unformatPhone = (v: string) => v.replace(/\s+/g, '')

  const verifyPassword = async (pwd: string) => {
    try {
      await http.post('/api/auth/verify-password/', { password: pwd })
      setPasswordChecked(true)
      await handleSaveProfile()
      onPasswordValidated?.()
    } catch {
      toast.error('Mot de passe incorrect.')
    }
  }

  const handleSaveProfile = async () => {
    const userId = user?.id
    if (!userId) {
      toast.warning('Non authentifié')
      return
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !dateOfBirth) {
      toast.warning('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (!publicName.trim()) {
      toast.warning('Veuillez fournir un nom affiché publiquement.')
      return
    }
    if (!description.trim()) {
      toast.warning('Veuillez fournir une description.')
      return
    }

    const formData = new FormData()
    formData.append('first_name', firstName.trim())
    formData.append('last_name', lastName.trim())
    formData.append('email', email.trim())
    formData.append('phone', unformatPhone(phone))
    formData.append('date_of_birth', dateOfBirth)
    formData.append('public_display_name', publicName.trim())
    formData.append('description_utilisateur', description.trim())
    if (experience) formData.append('years_of_experience', experience.trim())
    if (avatar) formData.append('avatar', avatar)

    try {
      await http.patch(`/api/users/${userId}/`, formData)
      toast.success('Profil mis à jour avec succès')
      setPasswordChecked(false)
      const me = await http.get('/api/me/')
      setUser(me)
      setAvatarUrl(resolveMediaUrl(me?.avatar))
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      toast.error(`Erreur: ${detail || 'Une erreur est survenue.'}`)
    }
  }

  const handleClickSave = () => {
    const missing: string[] = []
    if (!firstName.trim()) missing.push('Prénom')
    if (!lastName.trim()) missing.push('Nom')
    if (!email.trim()) missing.push('Email')
    if (!dateOfBirth) missing.push('Date de naissance')
    if (!publicName.trim()) missing.push('Nom affiché publiquement')
    if (!description.trim()) missing.push('Description')
    if (missing.length > 0) {
      toast.warning(`Veuillez remplir les champs obligatoires suivants : ${missing.join(', ')}`)
      return
    }
    onShowPasswordConfirm()
  }

  const handleImgError = () => setAvatarUrl(null)

  return (
    <div className="bg-white rounded-lg p-6 pt-3 shadow-sm">
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-dark-green rounded-full overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                onError={handleImgError}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-pale-yellow" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-dark-green">
              {publicName || `${firstName} ${lastName}`}
            </h3>
            <p className="text-gray-600">{email}</p>
            <span className="inline-block bg-pale-yellow text-dark-green px-3 py-1 rounded-full text-sm font-medium mt-2">
              {user?.type === 'producer' ? 'Producteur' : 'Client'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Ex : Jean"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Ex : Dupont"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ex : jean.dupont@email.com"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={formatPhoneFR(phone)}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(raw)
              }}
              placeholder="Ex : 06 12 34 56 78"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Date de naissance <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Nom affiché publiquement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={publicName}
              onChange={e => setPublicName(e.target.value)}
              placeholder="Ex : La Ferme de Jean"
              className="form-input w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Années d’expérience
            </label>
            <input
              type="number"
              min={0}
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder="Ex : 5"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-green mb-2">Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0] || null
                if (file) {
                  setAvatar(file)
                  setAvatarUrl(URL.createObjectURL(file))
                }
              }}
              className="form-input w-full"
            />
          </div>

          {mainAddress && (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark-green mb-2">
                Adresse principale
              </label>
              <div className="text-gray-800 px-4 py-2 bg-gray-100 rounded-lg border border-gray-300">
                {mainAddress}
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-dark-green mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez votre activité ou votre rôle..."
              className="form-input w-full h-24 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleClickSave}
          className="mt-6 bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
        >
          Sauvegarder les modifications
        </button>
      </div>
    </div>
  )
}
