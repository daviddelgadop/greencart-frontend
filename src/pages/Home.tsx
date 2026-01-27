import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Users, Leaf, TrendingDown, ArrowRight } from 'lucide-react'
import BundleCard from '../components/BundleCard'
import { http } from '../lib/api'

// ... (vos types restent les mêmes) ...

export default function Home() {
  // ... (votre code state et useEffect reste le même) ...

  return (
    <div className="min-h-screen">

      {/* ✅ HERO - CONTRASTE CORRIGÉ */}
     <section className="relative bg-gc-green-dark text-white pt-10 pb-20">

        <div className="max-w-7xl mx-auto px-6">

          {/* ✅ H1 - Texte blanc pur */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
            Produits locaux anti-gaspillage – GreenCart
          </h1>

          {/* ✅ H2 - Vert clair pour bon contraste */}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-8 text-green-100 leading-relaxed">
            Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
          </h2>

          {/* ✅ Paragraphe - Vert très clair */}
          <div className="text-lg md:text-xl mb-10 text-green-50 max-w-3xl leading-relaxed">
            <p className="mb-4">
              Découvrez des produits locaux de qualité à prix réduits jusqu'à 40 %.
            </p>
            <p>
              Soutenez les producteurs locaux et participez activement à la lutte contre le gaspillage alimentaire grâce à GreenCart.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* ✅ BOUTON - Orange foncé sur texte blanc (meilleur contraste) */}
            <Link
              to="/shop"
              className="bg-gc-orange-dark text-white px-8 py-4 rounded-full font-semibold text-lg 
                         hover:bg-gc-orange transition-colors flex items-center justify-center group shadow-lg"
            >
              Commander dès maintenant
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/about"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg 
                         hover:bg-white hover:text-gc-green-dark transition-colors text-center shadow"
            >
              Découvrir notre mission
            </Link>
          </div>

        </div>
      </section>

      {/* ✅ IMPACT - CONTRASTE CORRIGÉ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Notre impact positif
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">

            <div>
              <div className="bg-gc-green-dark text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">1,000+</h3>
              <p className="text-gray-700 font-medium">Tonnes sauvées du gaspillage</p>
            </div>

            <div>
              {/* ✅ CORRIGÉ : Orange foncé sur texte blanc */}
              <div className="bg-gc-orange-dark text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">30+</h3>
              <p className="text-gray-700 font-medium">Producteurs partenaires</p>
            </div>

            <div>
              <div className="bg-gc-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">2,000+</h3>
              <p className="text-gray-700 font-medium">Clients satisfaits</p>
            </div>

          </div>
        </div>
      </section>

      {/* ✅ OFFRES - CONTRASTE CORRIGÉ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Offres du moment
            </h2>
            {/* ✅ CORRIGÉ : Texte gris foncé */}
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">
              Découvrez nos meilleures offres sur des produits de qualité à prix réduits
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse h-[520px]" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center text-gray-600 py-16 bg-white rounded-2xl shadow-sm">
              <p className="text-lg font-medium">Aucune offre disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featured.map(b => (
                <BundleCard key={b.id} bundle={b} viewMode="grid" />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="bg-gc-green-dark hover:bg-gc-green text-white px-8 py-4 rounded-full font-semibold text-lg 
                         transition-colors inline-flex items-center group shadow-lg"
            >
              Voir tous les produits
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* ✅ MISSION - CONTRASTE CORRIGÉ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Notre mission : zéro gaspillage
              </h2>

              {/* ✅ CORRIGÉ : Texte gris standard */}
              <p className="text-gray-700 text-lg mb-6">
                GreenCart connecte les consommateurs conscients avec les producteurs locaux pour donner une seconde vie aux produits alimentaires de qualité.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Produits locaux et de saison",
                  "Prix réduits jusqu'à 50%",
                  "Soutien aux petits producteurs"
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gc-green-dark rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    {/* ✅ CORRIGÉ : Texte gris foncé */}
                    <span className="text-gray-800 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              {/* ✅ CORRIGÉ : Bouton orange foncé sur blanc */}
              <Link
                to="/about"
                className="bg-gc-orange-dark hover:bg-gc-orange text-white px-6 py-3 rounded-full font-semibold 
                           transition-colors inline-flex items-center group shadow-md"
              >
                En savoir plus
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div>
              <img
                src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Producteur local travaillant dans son champ"
                className="rounded-2xl shadow-lg w-full"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ✅ CTA FINAL - CONTRASTE CORRIGÉ */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">

          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Rejoignez le mouvement anti-gaspillage
          </h2>

          {/* ✅ CORRIGÉ : Texte gris clair */}
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Inscrivez-vous dès aujourd'hui et recevez 10€ de réduction sur votre première commande
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            {/* ✅ CORRIGÉ : Bouton orange foncé sur blanc */}
            <Link
              to="/register"
              className="bg-gc-orange-dark hover:bg-gc-orange text-white px-8 py-4 rounded-full font-semibold text-lg 
                         transition-colors shadow-lg"
            >
              Créer mon compte client
            </Link>

            <Link
              to="/register?type=producer"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg 
                         hover:bg-white hover:text-gray-900 transition-colors shadow"
            >
              Devenir producteur partenaire
            </Link>

          </div>

        </div>
      </section>

    </div>
  )
}
