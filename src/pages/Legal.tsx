import React from 'react'
import { Building, Mail, Phone, MapPin, Globe, FileText } from 'lucide-react'

export default function Legal() {
  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO estándar */}
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-dark-green flex items-center justify-center shrink-0">
                <Building className="w-7 h-7 text-pale-yellow" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight">
                  Mentions légales
                </h1>
                <p className="mt-2 text-gray-600">
                  Informations légales obligatoires et coordonnées de l’éditeur du site.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENIDO en tarjetas uniformes */}
        <div className="space-y-8">
          {/* Société */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-6 flex items-center gap-3">
              <Building className="w-6 h-6 text-orange-beige" />
              Informations sur l’entreprise
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">Dénomination sociale</h3>
                  <p className="text-gray-600">GreenCart SAS</p>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">Forme juridique</h3>
                  <p className="text-gray-600">Société par Actions Simplifiée (SAS)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">Capital social</h3>
                  <p className="text-gray-600">12 000 € entièrement libéré</p>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">Président</h3>
                  <p className="text-gray-600">Lucie MARTIN</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">RCS</h3>
                  <p className="text-gray-600">Lyon B 987 654 321</p>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">SIRET</h3>
                  <p className="text-gray-600">123 456 789 00010</p>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">Code APE</h3>
                  <p className="text-gray-600">4791B — Vente à distance sur catalogue spécialisé</p>
                </div>
                <div>
                  <h3 className="font-semibold text-dark-green mb-1">N° TVA Intracommunautaire</h3>
                  <p className="text-gray-600">FR 12 345 678 912</p>
                </div>
              </div>
            </div>
          </section>

          {/* Coordonnées */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-6 flex items-center gap-3">
              <Mail className="w-6 h-6 text-orange-beige" />
              Coordonnées
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <h3 className="font-semibold text-dark-green mb-1">Siège social</h3>
                    <p className="text-gray-600">
                      8 Rue de la République<br />
                      69001 Lyon<br />
                      France
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <h3 className="font-semibold text-dark-green mb-1">Téléphone</h3>
                    <p className="text-gray-600">+33 1 23 45 67 89</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <h3 className="font-semibold text-dark-green mb-1">Email</h3>
                    <p className="text-gray-600">contact@greencart.fr</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <h3 className="font-semibold text-dark-green mb-1">Site web</h3>
                    <p className="text-gray-600">www.greencart.fr</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Direction de la publication */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">
              Direction de la publication
            </h2>
            <div className="bg-pale-yellow/30 p-6 rounded-xl">
              <p className="text-gray-700">
                <strong>Directeur de la publication :</strong> Lucie MARTIN, Présidente de GreenCart SAS
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Contact :</strong> direction@greencart.fr
              </p>
            </div>
          </section>

          {/* Hébergement */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-6">
              Hébergement
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-dark-green mb-2">Hébergeur du site</h3>
                <div className="text-gray-600">
                  <p>Amazon Web Services (AWS) – Hébergement Elastic Beanstalk</p>
                  <p>31 Place des Corolles, Tour Carpe Diem</p>
                  <p>92400 Courbevoie, France</p>
                  <p>Téléphone : +33 1 46 17 10 00</p>
                  <p>Site web : <a href="https://aws.amazon.com/fr/">https://aws.amazon.com/fr/</a></p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-dark-green mb-2">Données personnelles</h3>
                <p className="text-gray-600">
                  Les serveurs hébergeant les données personnelles sont situés en France, conformément au RGPD.
                </p>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-orange-beige" />
              Propriété intellectuelle
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                L’ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, sons, logiciels, etc.)
                est protégé par les lois en vigueur sur la propriété intellectuelle.
              </p>
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-red-800">
                  <strong>Tous droits réservés :</strong> Toute reproduction, représentation, modification,
                  publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé,
                  est interdite, sauf autorisation écrite préalable de GreenCart.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-dark-green mb-2">Marques et logos</h3>
                <p className="text-gray-600">
                  Les marques « GreenCart » et tous les logos associés sont des marques déposées de GreenCart SAS.
                  Toute utilisation non autorisée constitue une contrefaçon.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies & Données perso */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-6">
              Cookies et données personnelles
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Ce site utilise des cookies pour améliorer l’expérience utilisateur et réaliser des statistiques de visite.
                Pour plus d’informations, consultez notre
                <a href="/privacy" className="text-dark-green hover:text-medium-brown transition-colors ml-1">
                  politique de confidentialité
                </a>.
              </p>
              <div>
                <h3 className="font-semibold text-dark-green mb-2">Délégué à la Protection des Données (DPO)</h3>
                <p className="text-gray-600">Pour toute question relative à la protection de vos données personnelles :</p>
                <p className="text-gray-600 mt-2">
                  <strong>Email :</strong> dpo@greencart.fr
                </p>
              </div>
            </div>
          </section>

          {/* Droit applicable */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-6">
              Droit applicable et juridiction
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Les présentes mentions légales sont régies par le droit français. En cas de litige,
                les tribunaux de Paris seront seuls compétents.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-blue-800">
                  <strong>Médiation :</strong> Conformément à l’article L.616-1 du Code de la consommation,
                  nous proposons un dispositif de médiation de la consommation. L’entité de médiation retenue est :
                  <a href="https://www.mediation-conso.fr" className="underline ml-1">
                    CNPM — Médiation de la consommation
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Contact légal */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-6">
              Contact pour questions légales
            </h2>
            <div className="bg-pale-yellow/30 p-6 rounded-xl">
              <p className="text-gray-700 mb-4">
                Pour toute question concernant ces mentions légales ou nos conditions d’utilisation :
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email :</strong> legal@greencart.fr</p>
                <p><strong>Courrier :</strong> Service Juridique GreenCart, 8 Rue de la République, 69001 Lyon</p>
                <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}
