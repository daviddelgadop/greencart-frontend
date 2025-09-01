import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Sparkles, ShoppingCart, Package } from 'lucide-react';
import { http } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import type { BundleItem, Product, CartItem } from '../types/CartItem';

type Bundle = {
  id: number;
  title: string;
  items: BundleItem[];
  stock: number;
  discounted_percentage?: number | string | null;
  original_price: string | number;
  discounted_price?: string | number | null;
  total_avoided_waste_kg?: string | number | null;
  total_avoided_co2_kg?: string | number | null;
};

export default function Confirmation() {
  const { addToCart } = useCart();

  const [recs, setRecs] = useState<Bundle[] | null>(null);
  const [recsLoading, setRecsLoading] = useState<boolean>(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [addingRecIds, setAddingRecIds] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setRecsLoading(true);
      setRecsError(null);
      try {
        const data = await http.get<Bundle[]>('/api/recommendations/?limit=3');
        if (!alive) return;
        setRecs(Array.isArray(data) ? data : []);
      } catch {
        if (!alive) return;
        setRecs([]);
        setRecsError('Impossible de charger vos recommandations.');
      } finally {
        if (!alive) return;
        setRecsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const addBundleToCart = async (b: Bundle) => {
    const images = b.items?.flatMap((it) => it.product.images || []) || [];
    const firstProduct = b.items?.[0]?.product as Product | undefined;

    const discountPct = Number(b.discounted_percentage ?? 0);
    const hasDiscount = discountPct > 0 && b.discounted_price != null;
    const price = hasDiscount ? Number(b.discounted_price) : Number(b.original_price);

    const totalWaste =
      typeof b.total_avoided_waste_kg === 'string'
        ? parseFloat(b.total_avoided_waste_kg) || 0
        : (b.total_avoided_waste_kg ?? 0);
    const totalCo2 =
      typeof b.total_avoided_co2_kg === 'string'
        ? parseFloat(b.total_avoided_co2_kg) || 0
        : (b.total_avoided_co2_kg ?? 0);

    const payload: CartItem = {
      id: b.id,
      title: b.title,
      image: images[0]?.image || '',
      price,
      quantity: 1,
      dluo: null,
      items: b.items,
      producerName: firstProduct?.company_name || 'Producteur inconnu',
      total_avoided_waste_kg: totalWaste,
      total_avoided_co2_kg: totalCo2,
    };

    await addToCart(payload);
  };

  return (
    <div className="min-h-screen bg-pale-yellow/20 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-2xl w-full mx-auto mb-10">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold text-dark-green mb-2">Commande confirmée !</h1>
          <p className="text-gray-600 mb-6">
            Merci pour votre achat. Vous recevrez bientôt un e-mail avec les détails de votre commande.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/account/orders"
              className="inline-block bg-dark-green text-pale-yellow px-6 py-3 rounded-full font-semibold hover:bg-dark-green/90 transition"
            >
              Consulter mes commandes
            </Link>
            <Link
              to="/shop"
              className="inline-block bg-white text-dark-green border border-dark-green px-6 py-3 rounded-full font-semibold hover:bg-dark-green hover:text-pale-yellow transition"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>

        <section className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-dark-green" />
            <h2 className="text-lg font-semibold text-dark-green">Recommandés pour vous</h2>
          </div>

          {recsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                  <div className="h-4 bg-gray-200 rounded mb-4 w-1/2" />
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : recsError ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl p-4">
              {recsError}
            </div>
          ) : !recs || recs.length === 0 ? (
            <div className="text-gray-600">Aucune recommandation pour le moment.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recs.map((b) => {
                const firstProduct = b.items?.[0]?.product as Product | undefined;
                const images = b.items?.flatMap((it) => it.product.images || []) || [];
                const cover = images[0]?.image || '';
                const discountPct = Number(b.discounted_percentage ?? 0);
                const hasDiscount = discountPct > 0 && b.discounted_price != null;
                const price = hasDiscount
                  ? Number(b.discounted_price).toFixed(2)
                  : Number(b.original_price).toFixed(2);

                return (
                  <div
                    key={`rec-${b.id}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col"
                  >
                    <Link to={`/bundle/${b.id}`} className="flex flex-col flex-1">
                      <div className="relative mb-3">
                        {cover ? (
                          <img src={cover} alt={b.title} className="w-full h-48 object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                            Image
                          </div>
                        )}

                        {Number(b.stock) <= 0 && (
                          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Rupture de stock
                          </div>
                        )}

                        {hasDiscount && (
                          <div className="absolute top-3 right-3 bg-orange-beige text-white text-xs font-semibold px-2 py-1 rounded-full">
                            -{discountPct.toFixed(0)}%
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-dark-green leading-snug line-clamp-2">
                          {b.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {firstProduct?.company_name || 'Producteur inconnu'}
                        </p>

                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl font-bold text-dark-green">{price}€</span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">
                              {Number(b.original_price).toFixed(2)}€
                            </span>
                          )}
                          <span className="ml-auto text-sm text-gray-600 flex items-center gap-1">
                            <Package className="w-4 h-4 text-gray-400" />
                            Stock {b.stock}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="h-px bg-gray-100 my-4" />

                    <button
                      onClick={async () => {
                        if (addingRecIds.includes(b.id)) return;
                        setAddingRecIds((prev) => [...prev, b.id]);
                        try {
                          if (Number(b.stock) <= 0) return;
                          await addBundleToCart(b);
                        } finally {
                          setAddingRecIds((prev) => prev.filter((x) => x !== b.id));
                        }
                      }}
                      disabled={addingRecIds.includes(b.id) || Number(b.stock) <= 0}
                      className={`${
                        addingRecIds.includes(b.id) || Number(b.stock) <= 0
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-dark-green text-pale-yellow hover:bg-dark-green/90'
                      } px-2.5 py-1.5 rounded-full font-semibold text-sm shadow-sm transition-colors flex items-center justify-center space-x-2 w-full`}
                      title={Number(b.stock) > 0 ? 'Ajouter au panier' : 'Indisponible – rupture de stock'}
                    >
                      <ShoppingCart className="w-4 h-4 shrink-0" />
                      <span className="min-w-0">Ajouter</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
