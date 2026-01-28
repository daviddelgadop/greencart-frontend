import React, { useState } from "react";

export default function CookieManager() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  const acceptAll = () => {
    localStorage.setItem("cookies-choice", "accepted");
    window.location.reload();
  };

  const rejectAll = () => {
    localStorage.setItem("cookies-choice", "refused");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-amber-50 text-green-900 px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-8">

        <h1 className="text-3xl font-bold">Gérer les cookies</h1>
        <p className="text-sm">
          Les cookies collectent certaines informations sur votre utilisation du site.
          Certains sont essentiels, d’autres sont facultatifs.
        </p>

        {/* Boutons principaux */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={acceptAll}
            className="px-6 py-3 bg-green-800 text-white rounded-full font-semibold hover:bg-green-900 transition"
          >
            Tout accepter
          </button>

          <button
            onClick={rejectAll}
            className="px-6 py-3 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition"
          >
            Tout refuser
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-6">

          {/* Essentiels */}
          <div>
            <button
              onClick={() => toggle("essentiels")}
              className="font-semibold underline"
            >
              Cookies essentiels
            </button>
            {expanded === "essentiels" && (
              <p className="mt-2 text-sm">
                Toujours activés. Nécessaires au bon fonctionnement du site.
              </p>
            )}
          </div>

          {/* Fonctionnalité */}
          <div>
            <button
              onClick={() => toggle("fonctionnalite")}
              className="font-semibold underline"
            >
              Cookies de fonctionnalité
            </button>
            {expanded === "fonctionnalite" && (
              <p className="mt-2 text-sm">
                Permettent de mémoriser vos préférences et d’améliorer l’expérience.
              </p>
            )}
          </div>

          {/* Performance */}
          <div>
            <button
              onClick={() => toggle("performance")}
              className="font-semibold underline"
            >
              Cookies de performance
            </button>
            {expanded === "performance" && (
              <p className="mt-2 text-sm">
                Nous aident à analyser l’utilisation du site pour l’améliorer.
              </p>
            )}
          </div>

        </div>

        <a
          href="/"
          className="inline-block mt-6 text-green-700 underline hover:text-green-900"
        >
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
}
