import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark-brown text-pale-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* LOGO + TEXTE */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/images/logo_inv.png" alt="GreenCart logo" className="h-12 w-auto" />
            </div>
            <p className="text-pale-yellow/80 mb-4 max-w-md">
              Plateforme e-commerce dédiée aux produits alimentaires locaux et à la lutte contre le gaspillage. 
              Soutenons ensemble nos producteurs locaux et préservons notre environnement.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-pale-yellow/60 hover:text-pale-yellow transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-pale-yellow/60 hover:text-pale-yellow transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-pale-yellow/60 hover:text-pale-yellow transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:contact@greencart.fr" className="text-pale-yellow/60 hover:text-pale-yellow transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* NAVIGATION */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Boutique
                </Link>
              </li>
              <li>
                <Link to="/producers" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Producteurs
                </Link>
              </li>

              {/* 🌿 Nouveau lien ajouté */}
              <li>
                <Link to="/devenir-producteur" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Devenir producteur
                </Link>
              </li>

              <li>
                <Link to="/blog" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* INFORMATIONS LÉGALES */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informations légales</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/legal" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  CGU & CGV
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-pale-yellow/80 hover:text-pale-yellow transition-colors">
                  Plan du site
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BAS DE PAGE */}
        <div className="border-t border-pale-yellow/20 mt-8 pt-8 text-center">
          <p className="text-pale-yellow/60">
            © 2025 GreenCart. Tous droits réservés. Plateforme développée avec ❤️ pour un avenir plus durable.
          </p>
        </div>
      </div>
    </footer>
  )
}
