import React from 'react'
import { FileText, Scale, ShoppingCart, Truck, CreditCard, AlertTriangle } from 'lucide-react'

export default function Terms() {
  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HERO estándar */}
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-dark-green flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-pale-yellow" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight">
                  Conditions Générales d'Utilisation et de Vente
                </h1>
                <p className="mt-2 text-gray-600">Dernière mise à jour : 15 août 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENIDO en tarjetas uniformes */}
        <div className="space-y-8">

          {/* Préambule */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <Scale className="w-6 h-6 text-orange-beige" />
              Préambule
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions Générales d'Utilisation et de Vente (CGU/CGV) régissent
              l'utilisation de la plateforme GreenCart et les relations contractuelles entre
              GreenCart SAS et ses utilisateurs. En utilisant notre service, vous acceptez
              ces conditions dans leur intégralité.
            </p>

            <div className="bg-pale-yellow/30 p-6 rounded-xl mt-6">
              <h3 className="font-semibold text-dark-green mb-2">Informations légales</h3>
              <div className="text-gray-600 space-y-1">
                <p><strong>Raison sociale :</strong> GreenCart SAS</p>
                <p><strong>Capital social :</strong> 50 000 €</p>
                <p><strong>RCS :</strong> Paris B 123 456 789</p>
                <p><strong>SIRET :</strong> 12345678901234</p>
                <p><strong>TVA :</strong> FR12345678901</p>
                <p><strong>Siège social :</strong> 123 Rue de la Transition, 75001 Paris</p>
              </div>
            </div>
          </section>

          {/* Description du service */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-orange-beige" />
              Description du service
            </h2>
            <p className="text-gray-600 mb-4">
              GreenCart est une plateforme e-commerce spécialisée dans la vente de produits
              alimentaires locaux et la lutte contre le gaspillage alimentaire. Notre service
              met en relation :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Des consommateurs soucieux de l'environnement et de la qualité</li>
              <li>Des producteurs locaux proposant des produits frais et authentiques</li>
              <li>Des commerçants souhaitant valoriser leurs invendus</li>
            </ul>

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <p className="text-green-800">
                <strong>Notre engagement :</strong> Tous les produits vendus sur GreenCart
                respectent les normes de sécurité alimentaire et sont propres à la consommation.
              </p>
            </div>
          </section>

          {/* Création de compte */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">Création de compte</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-green">Conditions d'inscription</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Être âgé de 18 ans minimum</li>
                <li>Fournir des informations exactes et à jour</li>
                <li>Accepter les présentes CGU/CGV</li>
                <li>Respecter la politique de confidentialité</li>
              </ul>

              <h3 className="text-lg font-semibold text-dark-green">Types de comptes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4 rounded-xl">
                  <h4 className="font-medium text-dark-green mb-2">Compte Client</h4>
                  <p className="text-gray-600 text-sm">
                    Permet d'acheter des produits, de gérer ses commandes et de bénéficier
                    du programme de fidélité.
                  </p>
                </div>
                <div className="border border-gray-200 p-4 rounded-xl">
                  <h4 className="font-medium text-dark-green mb-2">Compte Producteur</h4>
                  <p className="text-gray-600 text-sm">
                    Permet de vendre des produits, de gérer son catalogue et d'accéder
                    aux outils d'analyse.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Commandes et paiement */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-orange-beige" />
              Commandes et paiement
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Processus de commande</h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-1">
                  <li>Sélection des produits et ajout au panier</li>
                  <li>Vérification du panier et des informations de livraison</li>
                  <li>Choix du mode de paiement</li>
                  <li>Validation et confirmation de la commande</li>
                  <li>Réception d'un email de confirmation</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Moyens de paiement acceptés</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Cartes bancaires (Visa, Mastercard, American Express)</li>
                  <li>PayPal</li>
                  <li>Virement bancaire (pour les commandes professionnelles)</li>
                  <li>Chèques cadeaux GreenCart</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-blue-800">
                  <strong>Sécurité :</strong> Tous les paiements sont sécurisés par cryptage SSL
                  et traités par notre partenaire certifié PCI-DSS.
                </p>
              </div>
            </div>
          </section>

          {/* Livraison */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <Truck className="w-6 h-6 text-orange-beige" />
              Livraison
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Zones de livraison</h3>
                <p className="text-gray-600 mb-2">
                  Nous livrons actuellement dans toute la France métropolitaine.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Délais de livraison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Mode</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Délai</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Tarif</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Standard</td>
                        <td className="border border-gray-200 px-4 py-2">2-3 jours ouvrés</td>
                        <td className="border border-gray-200 px-4 py-2">Gratuit dès 30€</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Express</td>
                        <td className="border border-gray-200 px-4 py-2">24h</td>
                        <td className="border border-gray-200 px-4 py-2">9,90€</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">Point relais</td>
                        <td className="border border-gray-200 px-4 py-2">2-4 jours ouvrés</td>
                        <td className="border border-gray-200 px-4 py-2">3,90€</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Retours et remboursements */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">
              Retours et remboursements
            </h2>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                <p className="text-yellow-800">
                  <strong>Attention :</strong> En raison de la nature périssable des produits alimentaires,
                  les retours ne sont possibles qu'en cas de défaut de qualité ou d'erreur de livraison.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Conditions de retour</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Signaler le problème dans les 24h suivant la réception</li>
                  <li>Fournir des photos du produit défectueux</li>
                  <li>Conserver l'emballage d'origine</li>
                  <li>Respecter la chaîne du froid si applicable</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Modalités de remboursement</h3>
                <p className="text-gray-600">
                  En cas de retour accepté, nous procédons au remboursement intégral
                  (produit + frais de livraison) sous 14 jours sur le moyen de paiement utilisé.
                </p>
              </div>
            </div>
          </section>

          {/* Responsabilités */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-beige" />
              Responsabilités
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Responsabilité de GreenCart</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Assurer la disponibilité de la plateforme</li>
                  <li>Vérifier la qualité des producteurs partenaires</li>
                  <li>Respecter les délais de livraison annoncés</li>
                  <li>Protéger les données personnelles des utilisateurs</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-green mb-2">Responsabilité de l'utilisateur</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Fournir des informations exactes</li>
                  <li>Respecter les conditions d'utilisation</li>
                  <li>Signaler tout problème dans les délais</li>
                  <li>Utiliser la plateforme de manière loyale</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">
              Propriété intellectuelle
            </h2>
            <p className="text-gray-600 mb-4">
              Tous les éléments de la plateforme GreenCart (textes, images, logos, design, etc.)
              sont protégés par les droits de propriété intellectuelle et appartiennent à GreenCart
              ou à ses partenaires.
            </p>
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <p className="text-red-800">
                <strong>Interdiction :</strong> Toute reproduction, représentation, modification,
                publication ou transmission de ces éléments est strictement interdite sans
                autorisation écrite préalable.
              </p>
            </div>
          </section>

          {/* Résolution des litiges */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">
              Résolution des litiges
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                En cas de litige, nous privilégions une résolution amiable. Vous pouvez nous contacter :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Par email : support@greencart.fr</li>
                <li>Par téléphone : 01 23 45 67 89</li>
                <li>Par courrier : Service Client GreenCart, 123 Rue de la Transition, 75001 Paris</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-blue-800">
                  <strong>Médiation :</strong> En cas d'échec de la résolution amiable, vous pouvez
                  recourir gratuitement au médiateur de la consommation :
                  <a href="https://www.mediation-conso.fr" className="underline ml-1">
                    www.mediation-conso.fr
                  </a>
                </p>
              </div>

              <p className="text-gray-600 text-sm">
                À défaut de résolution amiable, les tribunaux de Paris seront seuls compétents.
              </p>
            </div>
          </section>

          {/* Dispositions finales */}
          <section className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-bold text-dark-green mb-4">
              Dispositions finales
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Les présentes CGU/CGV sont régies par le droit français. Elles peuvent être
                modifiées à tout moment. Les utilisateurs seront informés de toute modification
                par email ou notification sur la plateforme.
              </p>
              <p className="text-gray-600">
                Si une clause des présentes conditions était déclarée nulle ou non applicable,
                les autres clauses resteraient en vigueur.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
