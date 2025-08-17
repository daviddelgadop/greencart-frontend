import React from 'react'
import { ListTree, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SiteMap() {
  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO estándar */}
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-dark-green flex items-center justify-center shrink-0">
                <ListTree className="w-7 h-7 text-pale-yellow" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight">
                  Plan du site
                </h1>
                <p className="mt-2 text-gray-600">
                  Explorez toutes les pages disponibles sur la plateforme GreenCart.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIONES */}
        <div className="space-y-8">
          <Section
            title="Pages principales"
            links={[
              { to: '/', label: 'Accueil' },
              { to: '/about', label: 'À propos' },
              { to: '/shop', label: 'Boutique' },
              { to: '/producers', label: 'Producteurs' },
              { to: '/blog', label: 'Blog' },
              { to: '/contact', label: 'Contact' },
              { to: '/faq', label: 'FAQ' },
            ]}
          />

          <Section
            title="Espace utilisateur"
            links={[
              { to: '/account', label: 'Mon compte' },
              { to: '/cart', label: 'Panier' },
              { to: '/login', label: 'Connexion' },
              { to: '/register', label: 'Inscription' },
            ]}
          />

          <Section
            title="Informations légales"
            links={[
              { to: '/legal', label: 'Mentions légales' },
              { to: '/terms', label: 'CGU & CGV' },
              { to: '/privacy', label: 'Politique de confidentialité' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function Section({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
      <h2 className="text-xl font-bold text-dark-green mb-4 flex items-center gap-2">
        <LinkIcon className="w-5 h-5 text-orange-beige" />
        {title}
      </h2>
      <ul className="space-y-2 pl-2">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className="text-dark-green hover:text-medium-brown transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
