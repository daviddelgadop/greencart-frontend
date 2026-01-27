import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("cookies-accepted");
    if (!hasConsent) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies-accepted", "true");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookies-accepted", "false");
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
      <div className="max-w-6xl mx-auto px-6 pb-6">
        <div className="bg-amber-50 text-green-900 rounded-2xl p-6 shadow-2xl border border-green-800/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Texte principal */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold">Vos préférences de confidentialité</h3>

                <button
                  onClick={handleClose}
                  className="text-green-700 hover:text-green-900 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-green-800 text-sm mb-4">
                Nous utilisons des cookies nécessaires au fonctionnement du site et des cookies optionnels 
                pour analyser le trafic et améliorer votre expérience. Vous pouvez personnaliser vos choix.
              </p>

              {/* Liens rapides */}
              <div className="flex flex-wrap gap-4 text-sm">
                <Link to="/about" className="text-green-700 hover:text-green-900 transition-colors">
                  À propos
                </Link>
                <Link to="/shop" className="text-green-700 hover:text-green-900 transition-colors">
                  Boutique
                </Link>
                <Link to="/producers" className="text-green-700 hover:text-green-900 transition-colors">
                  Producteurs
                </Link>
                <Link to="/blog" className="text-green-700 hover:text-green-900 transition-colors">
                  Blog
                </Link>
                <Link to="/contact" className="text-green-700 hover:text-green-900 transition-colors">
                  Contact
                </Link>
                <Link to="/politique-cookies" className="text-green-700 hover:text-green-900 underline transition-colors">
                  En savoir plus
                </Link>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-center gap-4">

              <div className="flex items-center gap-2 bg-green-800/10 px-4 py-2 rounded-full border border-green-800/20">
                <span className="text-2xl font-bold text-green-800">-40%</span>
                <span className="text-green-900 text-sm">sur vos courses</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold text-sm transition-colors"
                >
                  Refuser
                </button>

                <button
                  onClick={handleAccept}
                  className="px-5 py-2.5 bg-green-800 hover:bg-green-900 text-white rounded-full font-semibold text-sm transition-colors shadow-md"
                >
                  Accepter
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
