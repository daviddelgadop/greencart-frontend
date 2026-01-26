import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">

      {/* HERO */}
      <section className="bg-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">

          {/* H1 SEO */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Produits locaux anti-gaspillage – GreenCart
          </h1>

          {/* H2 marketing */}
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
          </h2>

          {/* Texte introductif */}
          <p className="text-lg md:text-xl mb-8 max-w-3xl">
            Découvrez des produits locaux de qualité à prix réduits jusqu’à 40 %.
            Soutenez les producteurs locaux et participez activement à la lutte
            contre le gaspillage alimentaire grâce à GreenCart.
          </p>

          <div className="flex gap-4 flex-wrap">
            <Link
              to="/shop"
              className="bg-orange-400 text-black px-6 py-3 rounded-full font-semibold flex items-center gap-2"
            >
              Commander maintenant
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/about"
              className="border border-white px-6 py-3 rounded-full font-semibold"
            >
              Découvrir notre mission
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION FONCTIONNEMENT */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">
            Comment fonctionne GreenCart
          </h2>
          <p className="text-gray-700 max-w-3xl">
            GreenCart met en relation les consommateurs et les producteurs locaux
            afin de valoriser les invendus alimentaires et réduire le gaspillage,
            tout en proposant des prix accessibles.
          </p>
        </div>
      </section>

      {/* SECTION ENGAGEMENTS */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">
            Nos engagements pour une alimentation responsable
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li>• Réduction du gaspillage alimentaire</li>
            <li>• Valorisation des producteurs locaux</li>
            <li>• Circuits courts et consommation durable</li>
          </ul>
        </div>
      </section>

      {/* SECTION PRODUCTEURS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">
            Vous êtes producteur ?
          </h2>
          <p className="text-gray-700 mb-6 max-w-3xl">
            Rejoignez GreenCart et donnez une seconde vie à vos produits tout en
            bénéficiant d’une nouvelle visibilité auprès de consommateurs engagés.
          </p>

          <Link
            to="/producteurs/inscription"
            className="bg-green-800 text-white px-6 py-3 rounded-full font-semibold inline-block"
          >
            Devenir producteur partenaire
          </Link>
        </div>
      </section>

    </main>
  );
}
