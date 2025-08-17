import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft, Leaf } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pale-yellow/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-9xl font-bold text-dark-green/20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-dark-green rounded-full p-6">
                <Leaf className="w-16 h-16 text-pale-yellow" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-dark-green mb-4">
            Page introuvable
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Oups ! La page que vous cherchez semble avoir disparu.
          </p>
          <p className="text-gray-500">
            Elle a peut-être été déplacée, supprimée ou vous avez saisi une URL incorrecte.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-dark-green mb-6">
            Que souhaitez-vous faire ?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-dark-green hover:bg-pale-yellow/10 transition-colors group"
            >
              <div className="bg-dark-green text-pale-yellow p-2 rounded-full group-hover:bg-medium-brown transition-colors">
                <Home className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-dark-green">Retour à l'accueil</div>
                <div className="text-sm text-gray-500">Découvrir nos produits</div>
              </div>
            </Link>
            
            <Link
              to="/shop"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-dark-green hover:bg-pale-yellow/10 transition-colors group"
            >
              <div className="bg-orange-beige text-white p-2 rounded-full group-hover:bg-medium-brown transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-dark-green">Parcourir la boutique</div>
                <div className="text-sm text-gray-500">Voir tous les produits</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Popular Links */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-dark-green mb-4">
            Pages populaires
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/about"
              className="text-dark-green hover:text-medium-brown transition-colors underline"
            >
              À propos
            </Link>
            <Link
              to="/contact"
              className="text-dark-green hover:text-medium-brown transition-colors underline"
            >
              Contact
            </Link>
            <Link
              to="/faq"
              className="text-dark-green hover:text-medium-brown transition-colors underline"
            >
              FAQ
            </Link>
            <Link
              to="/blog"
              className="text-dark-green hover:text-medium-brown transition-colors underline"
            >
              Blog
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-dark-green transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la page précédente</span>
        </button>

        {/* Environmental Message */}
        <div className="mt-12 bg-pale-yellow/30 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Leaf className="w-5 h-5 text-dark-green" />
            <span className="font-medium text-dark-green">Le saviez-vous ?</span>
          </div>
          <p className="text-sm text-gray-600">
            Pendant que vous naviguez, nos producteurs continuent de sauver des tonnes 
            de produits du gaspillage alimentaire. Rejoignez le mouvement !
          </p>
        </div>
      </div>
    </div>
  )
}