import { Link } from "react-router-dom"
import { Leaf, TrendingDown, Users, ArrowRight } from "lucide-react"

export default function BecomeProducer() {
  return (
    <main className="min-h-screen bg-white font-poppins">

      {/* HERO */}
      <section className="bg-dark-green text-pale-yellow py-20">
        <div className="max-w-7xl mx-auto px-6">

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Devenir producteur partenaire GreenCart
          </h1>

          <p className="text-xl max-w-3xl text-pale-yellow/90">
            Valorisez vos produits locaux, réduisez le gaspillage alimentaire
            et développez vos ventes grâce à une plateforme engagée.
          </p>

          {/* Ajout demandé par le jury */}
          <p className="text-pale-yellow/90 max-w-3xl text-lg mt-4">
            Pour garantir la conformité légale, un numéro SIRET et un justificatif professionnel
            seront demandés lors de l’inscription.
          </p>

          <Link
            to="/register?type=producer"
            className="inline-flex items-center mt-8 bg-pale-yellow text-dark-green px-8 py-4 rounded-full font-semibold text-lg hover:bg-pale-yellow/90 transition"
          >
            Rejoindre GreenCart
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>

        </div>
      </section>

      {/* CONCEPT */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-dark-green mb-6">
            Une solution anti-gaspillage pensée pour les producteurs
          </h2>

          <p className="text-gray-700 max-w-3xl text-lg">
            GreenCart permet aux producteurs locaux de vendre leurs invendus ou surplus
            à prix réduit, tout en conservant une image qualitative et responsable.
          </p>

        </div>
      </section>

      {/* AVANTAGES */}
      <section className="py-20 bg-pale-yellow/30">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-dark-green mb-12 text-center">
            Pourquoi devenir producteur partenaire ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">

            <div>
              <TrendingDown className="w-10 h-10 mx-auto mb-4 text-dark-green" />
              <h3 className="text-xl font-semibold mb-2">
                Réduction des pertes
              </h3>
              <p className="text-gray-700">
                Transformez vos invendus en opportunité économique.
              </p>
            </div>

            <div>
              <Users className="w-10 h-10 mx-auto mb-4 text-dark-green" />
              <h3 className="text-xl font-semibold mb-2">
                Nouvelle clientèle
              </h3>
              <p className="text-gray-700">
                Touchez des consommateurs engagés et fidèles.
              </p>
            </div>

            <div>
              <Leaf className="w-10 h-10 mx-auto mb-4 text-dark-green" />
              <h3 className="text-xl font-semibold mb-2">
                Engagement responsable
              </h3>
              <p className="text-gray-700">
                Valorisez votre démarche durable et locale.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-dark-green text-pale-yellow text-center">
        <div className="max-w-4xl mx-auto px-6">

          <h2 className="text-3xl font-bold mb-6">
            Rejoignez le réseau de producteurs GreenCart
          </h2>

          <p className="text-lg mb-8 text-pale-yellow/90">
            L’inscription est simple et gratuite.
          </p>

          <Link
            to="/register?type=producer"
            className="bg-pale-yellow text-dark-green px-8 py-4 rounded-full font-semibold text-lg hover:bg-pale-yellow/90 transition"
          >
            Devenir producteur
          </Link>

        </div>
      </section>

    </main>
  )
}
