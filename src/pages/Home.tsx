import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BundleCard from "../components/BundleCard";
import { http } from "../lib/api";

// Types API
type City = { name: string; postal_code: string };
type CompanyAddress = { city: City };
type CompanyData = { name: string; address: CompanyAddress; certifications?: { code: string }[] };
type Product = { title: string; eco_score?: string; company_data: CompanyData; certifications?: { code: string }[] };
type ProductItem = { product: Product; best_before_date?: string | null };
type ProducerData = { public_display_name: string };
type Region = { name: string; code: string };
type Department = { name: string; code: string };

type Bundle = {
  id: number;
  title: string;
  items: ProductItem[];
  discounted_price: string;
  original_price: string;
  discounted_percentage?: number;
  created_at?: string;
  producer_data?: ProducerData;
  region_data?: Region;
  department_data?: Department;
  stock?: number;
  total_avoided_waste_kg?: string;
  total_avoided_co2_kg?: string;
};

export default function Home() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch API
  useEffect(() => {
    async function fetchBundles() {
      try {
        const response = await http.get("/bundles");
        setBundles(response.data);
      } catch (error) {
        console.error("Erreur API :", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBundles();
  }, []);

  // Trier par date (nouveaux d’abord)
  const sortedBundles = useMemo(() => {
    return bundles.sort((a, b) => {
      const dateA = new Date(a.created_at || "").getTime();
      const dateB = new Date(b.created_at || "").getTime();
      return dateB - dateA;
    });
  }, [bundles]);

  return (
    <main className="min-h-screen">

      {/* HERO SEO */}
      <section className="bg-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Produits locaux anti-gaspillage – GreenCart
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Sauvons ensemble les produits locaux et luttons contre le gaspillage alimentaire
          </h2>

          <p className="text-lg md:text-xl mb-8 max-w-3xl">
            Découvrez des produits locaux de qualité à prix réduits jusqu’à 40 %. 
            Soutenez les producteurs et participez activement à la lutte contre le gaspillage alimentaire.
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

      {/* BUNDLES DYNAMIQUES */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">

          <h2 className="text-3xl font-bold mb-6">Nos paniers disponibles</h2>

          {loading ? (
            <p>Chargement des paniers...</p>
          ) : sortedBundles.length === 0 ? (
            <p>Aucun panier disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECTION FONCTIONNEMENT */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Comment fonctionne GreenCart</h2>
          <p className="text-gray-700 max-w-3xl">
            GreenCart met en relation les consommateurs et les producteurs locaux afin de valoriser 
            les invendus alimentaires et réduire le gaspillage, tout en proposant des prix accessibles.
          </p>
        </div>
      </section>

      {/* SECTION ENGAGEMENTS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Nos engagements</h2>
          <ul className="space-y-3 text-gray-700">
            <li>• Réduction du gaspillage alimentaire</li>
            <li>• Valorisation des producteurs locaux</li>
            <li>• Circuits courts et consommation durable</li>
          </ul>
        </div>
      </section>

      {/* SECTION PRODUCTEURS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Vous êtes producteur ?</h2>
          <p className="text-gray-700 mb-6 max-w-3xl">
            Rejoignez GreenCart et donnez une seconde vie à vos produits tout en bénéficiant 
            d’une nouvelle visibilité auprès de consommateurs engagés.
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
