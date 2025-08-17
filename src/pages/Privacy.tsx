import React from 'react'
import { Shield, Lock, Eye, UserCheck, Database, Mail } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO estándar */}
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-dark-green flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-pale-yellow" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight">
                  Politique de confidentialité
                </h1>
                <p className="mt-2 text-gray-600">Dernière mise à jour : 15 janvier 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENIDO en tarjetas uniformes */}
        <div className="space-y-8">
          {/* Intro */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-orange-beige" />
              Votre vie privée nous tient à cœur
            </h2>
            <p className="text-gray-600 leading-relaxed">
              GreenCart s'engage à protéger vos données personnelles et à respecter votre vie privée.
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations
              dans le cadre de notre plateforme e-commerce dédiée aux produits locaux et anti-gaspillage.
            </p>
          </section>

          {/* Données collectées */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-orange-beige" />
              Données collectées
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Données d'identification</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Nom, prénom, adresse email</li>
                  <li>Adresse de livraison et de facturation</li>
                  <li>Numéro de téléphone</li>
                  <li>Date de naissance (pour vérifier la majorité)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Données de navigation</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Historique de navigation sur notre site</li>
                  <li>Préférences de produits et recherches</li>
                  <li>Données de géolocalisation (avec votre consentement)</li>
                  <li>Informations sur votre appareil et navigateur</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Données commerciales</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Historique d'achats et commandes</li>
                  <li>Moyens de paiement (cryptés)</li>
                  <li>Communications avec notre service client</li>
                  <li>Avis et commentaires produits</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Utilisation des données */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-orange-beige" />
              Utilisation des données
            </h2>
            <div className="bg-pale-yellow/30 p-6 rounded-xl mb-6">
              <p className="text-gray-700 font-medium mb-2">Nous utilisons vos données uniquement pour :</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Traiter vos commandes et assurer la livraison</li>
                <li>Personnaliser votre expérience d'achat</li>
                <li>Vous proposer des produits correspondant à vos goûts</li>
                <li>Améliorer nos services et notre plateforme</li>
                <li>Vous envoyer des informations importantes sur vos commandes</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <p className="text-red-800 font-medium">
                🚫 Nous ne vendons jamais vos données à des tiers ni ne les utilisons à des fins publicitaires non consenties.
              </p>
            </div>
          </section>

          {/* Sécurité des données */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-orange-beige" />
              Sécurité des données
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-dark-green mb-2">Chiffrement</h3>
                <p className="text-gray-600 text-sm">
                  Toutes les données sensibles sont chiffrées avec des algorithmes de niveau bancaire (AES-256).
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-dark-green mb-2">Accès restreint</h3>
                <p className="text-gray-600 text-sm">
                  Seuls les employés autorisés peuvent accéder à vos données, dans le cadre strict de leurs fonctions.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-dark-green mb-2">Surveillance</h3>
                <p className="text-gray-600 text-sm">
                  Nos systèmes sont surveillés 24h/24 pour détecter toute tentative d'intrusion.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-dark-green mb-2">Sauvegardes</h3>
                <p className="text-gray-600 text-sm">
                  Vos données sont sauvegardées régulièrement dans des centres sécurisés en France.
                </p>
              </div>
            </div>
          </section>

          {/* Droits RGPD */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">Vos droits RGPD</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-dark-green pl-4">
                <h3 className="font-semibold text-dark-green">Droit d'accès</h3>
                <p className="text-gray-600 text-sm">
                  Vous pouvez demander une copie de toutes les données que nous détenons sur vous.
                </p>
              </div>
              <div className="border-l-4 border-dark-green pl-4">
                <h3 className="font-semibold text-dark-green">Droit de rectification</h3>
                <p className="text-gray-600 text-sm">
                  Vous pouvez corriger ou mettre à jour vos informations personnelles à tout moment.
                </p>
              </div>
              <div className="border-l-4 border-dark-green pl-4">
                <h3 className="font-semibold text-dark-green">Droit à l'effacement</h3>
                <p className="text-gray-600 text-sm">
                  Vous pouvez demander la suppression de vos données (sous certaines conditions).
                </p>
              </div>
              <div className="border-l-4 border-dark-green pl-4">
                <h3 className="font-semibold text-dark-green">Droit à la portabilité</h3>
                <p className="text-gray-600 text-sm">
                  Vous pouvez récupérer vos données dans un format structuré et lisible.
                </p>
              </div>
              <div className="border-l-4 border-dark-green pl-4">
                <h3 className="font-semibold text-dark-green">Droit d'opposition</h3>
                <p className="text-gray-600 text-sm">
                  Vous pouvez vous opposer au traitement de vos données à des fins de marketing.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">Cookies et traceurs</h2>
            <p className="text-gray-600 mb-4">
              Nous utilisons des cookies pour améliorer votre expérience de navigation :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Finalité</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Durée</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Essentiels</td>
                    <td className="border border-gray-200 px-4 py-2">Fonctionnement du site</td>
                    <td className="border border-gray-200 px-4 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Préférences</td>
                    <td className="border border-gray-200 px-4 py-2">Mémoriser vos choix</td>
                    <td className="border border-gray-200 px-4 py-2">1 an</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Analytiques</td>
                    <td className="border border-gray-200 px-4 py-2">Statistiques d'usage</td>
                    <td className="border border-gray-200 px-4 py-2">2 ans</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Nous contacter */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-orange-beige" />
              Nous contacter
            </h2>
            <div className="bg-pale-yellow/30 p-6 rounded-xl">
              <p className="text-gray-700 mb-4">
                Pour toute question concernant vos données personnelles ou pour exercer vos droits :
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email :</strong> dpo@greencart.fr</p>
                <p><strong>Courrier :</strong> GreenCart - DPO, 123 Rue de la Transition, 75001 Paris</p>
                <p><strong>Téléphone :</strong> 01 23 45 67 89</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Nous nous engageons à répondre à votre demande dans un délai maximum de 30 jours.
              </p>
            </div>
          </section>

          {/* Modifications */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">
              Modifications de cette politique
            </h2>
            <p className="text-gray-600">
              Cette politique de confidentialité peut être mise à jour pour refléter les changements
              dans nos pratiques ou la réglementation. Nous vous informerons de toute modification
              importante par email ou via une notification sur notre site.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
