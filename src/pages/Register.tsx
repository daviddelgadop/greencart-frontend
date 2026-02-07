import React, { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type AccountType = 'customer' | 'producer'

type PasswordCheck = {
  label: string
  ok: boolean
}

function normalize(s: string) {
  return (s || '').toLowerCase().replace(/\s+/g, '')
}

function validatePassword(
  pwd: string,
  context: { email: string; firstName: string; lastName: string }
) {
  const checks: PasswordCheck[] = [ 
    { label: 'Au moins 12 caractères', ok: pwd.length >= 12 },
    { label: 'Contient une lettre minuscule', ok: /[a-z]/.test(pwd) },
    { label: 'Contient une lettre majuscule', ok: /[A-Z]/.test(pwd) },
    { label: 'Contient un chiffre', ok: /\d/.test(pwd) },
    { label: 'Contient un symbole', ok: /[^A-Za-z0-9]/.test(pwd) },
    { label: 'Aucun espace', ok: !/\s/.test(pwd) },
  ]

  const localPart = context.email.split('@')[0] || ''
  const tooSimilar =
    normalize(pwd).includes(normalize(localPart)) ||
    normalize(pwd).includes(normalize(context.firstName)) ||
    normalize(pwd).includes(normalize(context.lastName))

  const similarityCheck: PasswordCheck = {
    label: 'Not similar to your name or email',
    ok: !tooSimilar,
  }

  const allChecks = [...checks, similarityCheck]
  const isValid = allChecks.every(c => c.ok)

  // Simple strength score (0–5) from core character set rules + length
  const score =
    (/[a-z]/.test(pwd) ? 1 : 0) +
    (/[A-Z]/.test(pwd) ? 1 : 0) +
    (/\d/.test(pwd) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pwd) ? 1 : 0) +
    (pwd.length >= 16 ? 1 : 0)

  return { checks: allChecks, isValid, score }
}

export default function Register() {
  const [searchParams] = useSearchParams()
  const defaultType = (searchParams.get('type') === 'producer' ? 'producer' : 'customer') as AccountType

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    date_of_birth: '',
    type: defaultType,
    public_display_name: '',
    acceptTerms: false,
    // Producteur
  siret: '',
  company_proof: null as File | null,
  company_type: '',
  legalDeclaration: false,
    
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { register } = useAuth()
  const navigate = useNavigate()

  const pwdValidation = useMemo(
    () =>
      validatePassword(formData.password, {
        email: formData.email,
        firstName: formData.first_name,
        lastName: formData.last_name,
      }),
    [formData.password, formData.email, formData.first_name, formData.last_name]
  )

  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword
  const canSubmit =
    pwdValidation.isValid && passwordsMatch && formData.acceptTerms && !isLoading && !!formData.date_of_birth

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const birthDate = new Date(formData.date_of_birth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const dayDiff = today.getDate() - birthDate.getDate()

    if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
      setError('Vous devez avoir au moins 18 ans pour vous inscrire.')
      return
    }

    if (!pwdValidation.isValid) {
      setError('Le mot de passe ne respecte pas les exigences.')
      return
    }

    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!formData.acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation")
      return
    }

    setIsLoading(true)
    try {
      await register(
        formData.first_name,
        formData.last_name,
        formData.email,
        formData.password,
        formData.type,
        formData.date_of_birth,
        formData.public_display_name
        
      )
      setSuccess('Compte créé. Si la vérification est requise, veuillez consulter votre email.')
      // navigate('/login')
    } catch {
      setError("Une erreur est survenue lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <img src="/images/logo_min_circle.png" alt="GreenCart logo" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-dark-green">Créer un compte</h1>
            <p className="text-gray-600 mt-2">Rejoignez la communauté GreenCart</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de compte</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
              >
                <option value="customer">Client</option>
                <option value="producer">Producteur</option>
              </select>
            </div>
           {formData.type === "producer" && (
  <>
    {/* SIRET */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Numéro SIRET *
      </label>
      <input
        type="text"
        name="siret"
        maxLength={14}
        required
        onChange={handleInputChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        placeholder="12345678901234"
      />
    </div>

    {/* Justificatif officiel */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Justificatif professionnel (Kbis, MSA…) *
      </label>
      <input
        type="file"
        name="company_proof"
        accept=".pdf,.jpg,.jpeg,.png"
        required
        onChange={(e) =>
          setFormData(prev => ({
            ...prev,
            company_proof: e.target.files ? e.target.files[0] : null,
          }))
        }
        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
      />
    </div>

    {/* Type de société */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Type de société *
      </label>
      <select
        name="company_type"
        value={formData.company_type || ""}
        onChange={handleInputChange}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
      >
        <option value="">Sélectionnez</option>
        <option value="micro">Micro-entreprise</option>
        <option value="sas">SAS</option>
        <option value="sarl">SARL</option>
        <option value="auto">Auto-entrepreneur</option>
      </select>
    </div>

    {/* Déclaration de conformité */}
    <div className="flex items-start mt-2">
      <input
        id="legalDeclaration"
        name="legalDeclaration"
        type="checkbox"
        checked={formData.legalDeclaration || false}
        onChange={(e) =>
          setFormData(prev => ({
            ...prev,
            legalDeclaration: e.target.checked,
          }))
        }
        className="mt-1 w-4 h-4 text-dark-green focus:ring-dark-green border-gray-300 rounded"
        required
      />
      <label htmlFor="legalDeclaration" className="ml-2 text-sm text-gray-600">
        Je certifie que mes produits sont conformes aux normes légales et sanitaires *
      </label>
    </div>
  </>
)}



            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                  placeholder="Votre prénom"
                />
              </div>
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div>
              <label htmlFor="public_display_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom affiché public
              </label>
              <input
                id="public_display_name"
                name="public_display_name"
                type="text"
                value={formData.public_display_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                placeholder="Nom affiché"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                  placeholder="votre@email.fr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                  placeholder="••••••••••••"
                  aria-describedby="password-help"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 w-5 h-5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {/* Strength bar */}
              <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                <div
                  className={`h-2 rounded ${pwdValidation.score <= 2 ? 'bg-red-500' : pwdValidation.score === 3 ? 'bg-yellow-500' : 'bg-green-600'}`}
                  style={{ width: `${(pwdValidation.score / 5) * 100}%` }}
                />
              </div>

              {/* Checklist */}
              <ul id="password-help" className="mt-3 space-y-1 text-sm">
                {pwdValidation.checks.map(c => (
                  <li key={c.label} className={`flex items-center gap-2 ${c.ok ? 'text-green-700' : 'text-gray-600'}`}>
                    {c.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 w-5 h-5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {!passwordsMatch && formData.confirmPassword.length > 0 && (
                <p className="mt-2 text-sm text-red-600">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent"
              />
            </div>

            <div className="flex items-start">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-dark-green focus:ring-dark-green border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
                J'accepte les{' '}
                <Link to="/terms" className="text-dark-green hover:text-medium-brown transition-colors">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link to="/privacy" className="text-dark-green hover:text-medium-brown transition-colors">
                  politique de confidentialité
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-dark-green text-pale-yellow py-3 rounded-lg font-semibold hover:bg-dark-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-dark-green font-semibold hover:text-medium-brown transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
