import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Menu, X, User } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { state } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/shop?search=${encodeURIComponent(q)}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    if (isMenuOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMenuOpen])

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/images/logo.png" alt="GreenCart logo" className="h-12 w-auto" />
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des produits locaux..."
                className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-dark-green"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </form>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-700 hover:text-dark-green transition-colors">À propos</Link>
            <Link to="/shop" className="text-gray-700 hover:text-dark-green transition-colors">Boutique</Link>
            <Link to="/producers" className="text-gray-700 hover:text-dark-green transition-colors">Producteurs</Link>
            <Link to="/blog" className="text-gray-700 hover:text-dark-green transition-colors">Blog</Link>
            <Link to="/contact" className="text-gray-700 hover:text-dark-green transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center space-x-4 ml-12">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-dark-green transition-colors">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{user?.public_display_name?.split(' ')[0] || user?.email}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Mon compte
                    </Link>
                    {user?.type === 'producer' && (
                      <Link to="/producer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Espace Producteur
                      </Link>
                    )}
                    {user?.is_staff && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Espace Administrateur
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-dark-green transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}

            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-dark-green transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-beige text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
              {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>
      </div>

    {isMenuOpen && (
      <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 pointer-events-none">
        {/* Scrim */}
        <div
          className="absolute inset-0 bg-black/10 pointer-events-auto"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
        {/* Panel */}
        <div className="absolute left-0 right-0 bg-white border-t shadow-md max-h-full overflow-y-auto pointer-events-auto">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-dark-green"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </form>

            <nav className="flex flex-col space-y-2">
              <Link
                to="/about"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-dark-green transition-colors py-2"
              >
                À propos
              </Link>
              <Link
                to="/shop"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-dark-green transition-colors py-2"
              >
                Boutique
              </Link>
              <Link
                to="/producers"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-dark-green transition-colors py-2"
              >
                Producteurs
              </Link>
              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-dark-green transition-colors py-2"
              >
                Blog
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 hover:text-dark-green transition-colors py-2"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </div>
    )}


    </header>
  )
}
