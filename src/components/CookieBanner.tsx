import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("cookies-choice");
    if (!hasConsent) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleChoice = (value: string) => {
    localStorage.setItem("cookies-choice", value);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-50 border-t border-green-800/20 shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6 text-green-900">

        {/* Texte principal */}
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">Mais d’abord, les cookies 🍪</h3>
          <p className="text-sm mb-3">
            Nous utilisons des cookies essentiels au fonctionnement de GreenCart. Si vous êtes d’accord, nous aimerions utiliser d’autres cookies pour personnaliser votre visite, la rendre plus sûre, adapter nos annonces ou analyser les performances du site.
          </p>
          <Link to="/politique-cookies" className="text-green-700 underline text-sm hover:text-green-900">
            En savoir plus sur vos choix
          </Link>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleChoice("refused")}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold text-sm transition"
          >
            Refuser tous les cookies
          </button>
          <button
            onClick={() => handleChoice("custom")}
            className="px-5 py-2.5 border border-green-800 text-green-800 rounded-full font-semibold text-sm hover:bg-green-800 hover:text-white transition"
          >
            Gérer les cookies
          </button>
          <button
            onClick={() => handleChoice("accepted")}
            className="px-5 py-2.5 bg-green-800 hover:bg-green-900 text-white rounded-full font-semibold text-sm transition shadow-md"
          >
            Accepter tous les cookies
          </button>
        </div>
      </div>
    </div>
  );
}
