import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Trash2, ShoppingCart, ArrowLeft, Heart, Package } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import type { CartItem, BundleItem, Product } from "../types/CartItem";
import { http } from "../lib/api";

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
  dluo?: string | null;
  producer_data?: {
    public_display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    years_of_experience?: number | null;
  } | null;
  department_data?: { name?: string | null } | null;
  region_data?: { name?: string | null } | null;
};

type Favorite = {
  id: number;
  bundle: Bundle;
  added_at: string;
};

export default function Favorites() {
  const token = localStorage.getItem("access");
  const { addToCart } = useCart();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [addingIds, setAddingIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setFavorites([]);
      return;
    }
    void fetchFavorites();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await http.get<Favorite[]>("/api/favorites/");
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFavorites([]);
      setError(
        err?.status === 401
          ? "Session expirée. Veuillez vous reconnecter."
          : "Impossible de charger vos favoris."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: number) => {
    setDeletingIds((prev) => [...prev, favoriteId]);
    try {
      await http.delete(`/api/favorites/${favoriteId}/`);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success("Retiré de vos favoris");
    } catch (e: any) {
      toast.error(
        e?.status === 403
          ? "Vous n'avez pas l'autorisation pour supprimer ce favori."
          : "Impossible de retirer des favoris."
      );
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== favoriteId));
    }
  };

  const addBundleToCart = async (b: Bundle) => {
    const images = b.items?.flatMap((it) => it.product.images || []) || [];
    const firstProduct = b.items?.[0]?.product as Product | undefined;

    const discountPct = Number(b.discounted_percentage ?? 0);
    const hasDiscount = discountPct > 0 && b.discounted_price != null;
    const price = hasDiscount ? Number(b.discounted_price) : Number(b.original_price);

    const totalWaste =
      typeof b.total_avoided_waste_kg === "string"
        ? parseFloat(b.total_avoided_waste_kg) || 0
        : (b.total_avoided_waste_kg ?? 0);
    const totalCo2 =
      typeof b.total_avoided_co2_kg === "string"
        ? parseFloat(b.total_avoided_co2_kg) || 0
        : (b.total_avoided_co2_kg ?? 0);

    const payload: CartItem = {
      id: b.id,
      title: b.title,
      image: images[0]?.image || "",
      price,
      quantity: 1,
      dluo: b.dluo ?? null,
      items: b.items,
      producerName: firstProduct?.company_name || "Producteur inconnu",
      total_avoided_waste_kg: totalWaste,
      total_avoided_co2_kg: totalCo2,
    };

    try {
      await addToCart(payload);
      toast.success(`${b.title} ajouté au panier !`);
    } catch {
      toast.error("Impossible d'ajouter au panier.");
    }
  };

  if (!token) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/shop" className="inline-flex items-center gap-2 text-dark-green mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour à la boutique
        </Link>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <Heart className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <h1 className="text-2xl font-semibold text-dark-green mb-2"></h1>
          <p className="text-gray-600">Connectez-vous pour voir et gérer vos favoris.</p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-dark-green text-white px-4 py-2 rounded-full"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/shop" className="inline-flex items-center gap-2 text-dark-green">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la boutique</span>
          </Link>
          <h1 className="text-2xl font-bold text-dark-green"></h1>
        </div>
        {/*<button
          onClick={() => fetchFavorites()}
          className="text-sm px-3 py-1 rounded-full border hover:bg-gray-50"
          title="Rafraîchir"
        >
          Rafraîchir
        </button>*/}

      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100">
              <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mb-4 w-1/2" />
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
          {error}
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <Heart className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <h2 className="text-xl font-semibold text-dark-green mb-2">Aucun favori pour le moment</h2>
          <p className="text-gray-600">Parcourez la boutique et ajoutez des produits à vos favoris.</p>
          <div className="mt-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-dark-green text-white px-4 py-2 rounded-full"
            >
              Découvrir la boutique
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const b = fav.bundle;
            const firstProduct = b.items?.[0]?.product as Product | undefined;
            const images = b.items?.flatMap((it) => it.product.images || []) || [];
            const cover = images[0]?.image || "";
            const discountPct = Number(b.discounted_percentage ?? 0);
            const hasDiscount = discountPct > 0 && b.discounted_price != null;
            const price = hasDiscount
              ? Number(b.discounted_price).toFixed(2)
              : Number(b.original_price).toFixed(2);

            return (
              <div
                key={fav.id}
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
                      {firstProduct?.company_name || "Producteur inconnu"}
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

                <div className="flex flex-col gap-3 mt-3">
                  <button
                    onClick={async () => {
                      if (addingIds.includes(b.id)) return;
                      setAddingIds((prev) => [...prev, b.id]);
                      try {
                        if (Number(b.stock) <= 0) {
                          toast.error("Ce lot est en rupture de stock.");
                          return;
                        }
                        await addBundleToCart(b);
                      } finally {
                        setAddingIds((prev) => prev.filter((x) => x !== b.id));
                      }
                    }}
                    disabled={addingIds.includes(b.id) || Number(b.stock) <= 0}
                    className={`${
                      addingIds.includes(b.id) || Number(b.stock) <= 0
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-dark-green text-pale-yellow hover:bg-dark-green/90"
                    } px-2.5 py-1.5 rounded-full font-semibold text-sm shadow-sm transition-colors flex items-center justify-center space-x-2 w-full`}
                    title={Number(b.stock) > 0 ? "Ajouter au panier" : "Indisponible – rupture de stock"}
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    <span className="min-w-0">
                      Ajouter<span className="hidden sm:inline"> au panier</span>
                    </span>
                  </button>

                  <button
                    onClick={() => removeFavorite(fav.id)}
                    disabled={deletingIds.includes(fav.id)}
                    className={`${
                      deletingIds.includes(fav.id)
                        ? "bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed"
                        : "bg-white text-dark-green border border-dark-green hover:bg-dark-green hover:text-pale-yellow"
                    } px-2.5 py-1.5 rounded-full font-semibold text-sm shadow-sm transition-colors flex items-center justify-center space-x-2 w-full`}
                    title="Retirer des favoris"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span className="min-w-0">Retirer</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
