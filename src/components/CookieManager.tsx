import React, { useState } from 'react'

export default function CookieManager() {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (section: string) => {
    setExpanded(expanded === section ? null : section)
  }

  const acceptAll = () => {
    localStorage.setItem("cookies-choice", "accepted")
    setOpen(false)
  }

  const rejectAll = () => {
    localStorage.setItem("cookies-choice", "refused")
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-50 text-green-900 border-t border-green-800/20 shadow-lg z-50">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        <h2 className="text-xl font-bold">Gérer les cookies</h2>
        <p className="text-sm">
          Les cookies collectent certaines informations sur votre utilisation du site. Certains sont essentiels, d’autres sont facultatifs.
          Vous pouvez choisir ce que nous utilisons.
        </p>

        {/* Sections */}
        <div className="space-y-4 text-sm">

          {/* Essentiels */}
          <div>
            <button onClick={() => toggle("essentiels")} className="font-semibold underline">
              Cookies essentiels
            </button>
            {expanded === "essentiels" && (
              <p className="mt-2">
                Toujours activés. Nécessaires au bon fonctionnement du site et à sa sécurité.
              </p>
            )}
          </div>

          {/* Fonctionnalité */}
          <div>
            <button onClick={() => toggle("fonctionnalite")} className="font-semibold underline">
              Cookies de fonctionnalité
            </button>
            {expanded === "fonctionnalite" && (
              <p className="mt-2">
                Permettent de mémoriser vos préférences et d’améliorer l’expérience utilisateur.
              </p>
            )}
          </div>

          {/* Performance */}
          <div>
            <button onClick={() => toggle("performance")} className="font-semibold underline">
              Cookies de performance
            </button>
            {expanded === "performance" && (
              <p className="mt-2">
                Nous aident à analyser l’utilisation du site pour l’améliorer.
              </p>
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button onClick={rejectAll} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold text-sm">
            Tout refuser
          </button>
          <button onClick={acceptAll} className="px-5 py-2.5 bg-green-800 hover:bg-green-900 text-white rounded-full font-semibold text-sm">
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  )
}
