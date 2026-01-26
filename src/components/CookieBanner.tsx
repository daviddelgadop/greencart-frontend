import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fait son choix
    const hasConsent = localStorage.getItem("cookies-accepted");
    if (!hasConsent) {
      // Afficher après 2 secondes pour ne pas gêner l'arrivée
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookies-accepted", "true");
    setIsVisible(false);
    // Ici, vous initialiseriez Google Analytics, Facebook Pixel, etc.
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
        <div className="bg-gray-800 text-white rounded-2xl p-6 shadow-2xl border border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Texte principal */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold">Vos préférences de confidentialité</h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Nous utilisons des cookies nécessaires au fonctionnement du site et des cookies optionnels 
                pour analyser le trafic et améliorer votre expérience. Vous pouvez personnaliser vos choix.
              </p>
              
              {/* Liens rapides */}
              <div className="flex flex-wrap gap-4 text-sm">
                <Link to="/about" className="text-green-300 hover:text-green-200 transition-colors">
                  À propos
                </Link>
                <Link to="/shop" className="text-green-300 hover:text-green-200 transition-colors">
                  Boutique
                </Link>
                <Link to="/producers" className="text-green-300 hover:text-green-200 transition-colors">
                  Producteurs
                </Link>
                <Link to="/blog" className="text-green-300 hover:text-green-200 transition-colors">
                  Blog
                </Link>
                <Link to="/contact" className="text-green-300 hover:text-green-200 transition-colors">
                  Contact
                </Link>
                <Link to="/politique-cookies" className="text-green-300 hover:text-green-200 transition-colors underline">
                  En savoir plus
                </Link>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-full">
                <span className="text-2xl font-bold text-green-300">-40%</span>
                <span className="text-green-100 text-sm">sur vos courses</span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold text-sm transition-colors"
                >
                  Refuser
                </button>
                <button
                  onClick={handleAccept}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm transition-colors shadow-md"
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
