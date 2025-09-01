import React, { useEffect, useMemo, useState } from 'react';
import { TrendingDown, Leaf, Euro, Award, Lock, Sparkles, ShoppingCart, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { http } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import type { CartItem, BundleItem, Product } from '../types/CartItem';

type Progress = {
  total_orders: number;
  total_waste_kg: number | string;
  total_co2_kg: number | string;
  total_savings_eur: number | string;
  producers_supported: number;
};

type RewardTier = {
  code: string;
  title: string;
  description: string;
  icon?: string;
  min_orders: number;
  min_waste_kg: number | string;
  min_co2_kg: number | string;
  min_producers_supported: number;
  min_savings_eur: number | string;
  benefit_kind: 'none' | 'coupon' | 'freeship';
  is_active: boolean;
};

type RewardEarned = {
  title: string;
  description: string;
  earned_on: string;
  benefit_status: 'none' | 'pending' | 'blocked' | 'fulfilled';
  benefit_payload?: Record<string, unknown>;
  fulfilled_at?: string | null;
  tier?: RewardTier | null;
};

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

function toNum(x: unknown): number {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') return parseFloat(x) || 0;
  return 0;
}

function progressToNext(value: number, steps: number[]) {
  if (steps.length === 0) return { current: 0, next: 0, pct: 0 };
  const sorted = [...steps].sort((a, b) => a - b);
  const current = sorted.filter((s) => value >= s).pop() ?? 0;
  const next = sorted.find((s) => s > value) ?? 0;
  const denom = Math.max(1, (next || current) - current);
  const pct = next ? Math.min(1, Math.max(0, (value - current) / denom)) : 1;
  return { current, next, pct };
}

export default function ImpactTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [earned, setEarned] = useState<RewardEarned[]>([]);

  const [recs, setRecs] = useState<Bundle[] | null>(null);
  const [recsLoading, setRecsLoading] = useState<boolean>(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [addingRecIds, setAddingRecIds] = useState<number[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, tRaw, eRaw] = await Promise.all([
          http.get<Progress>('/api/rewards/progress/'),
          http.get<any>('/api/reward-tiers/'),
          http.get<any>('/api/rewards/'),
        ]);
        setProgress(p ?? null);
        setTiers(Array.isArray(tRaw) ? tRaw : tRaw?.results ?? []);
        setEarned(Array.isArray(eRaw) ? eRaw : eRaw?.results ?? []);
      } catch {
        setError('Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setRecsLoading(true);
      setRecsError(null);
      try {
        const data = await http.get<Bundle[]>('/api/recommendations/?limit=3');
        setRecs(Array.isArray(data) ? data : []);
      } catch {
        setRecs([]);
        setRecsError('Impossible de charger vos recommandations.');
      } finally {
        setRecsLoading(false);
      }
    })();
  }, []);

  const wasteTiers = useMemo(
    () =>
      tiers
        .filter((x) => toNum(x.min_waste_kg) > 0 && x.is_active)
        .sort((a, b) => toNum(a.min_waste_kg) - toNum(b.min_waste_kg)),
    [tiers]
  );
  const prodTiers = useMemo(
    () =>
      tiers
        .filter((x) => x.min_producers_supported > 0 && x.is_active)
        .sort((a, b) => a.min_producers_supported - b.min_producers_supported),
    [tiers]
  );

  const wasteValue = toNum(progress?.total_waste_kg);
  const co2Value = toNum(progress?.total_co2_kg);
  const savingsValue = toNum(progress?.total_savings_eur);
  const producersValue = progress?.producers_supported ?? 0;

  const earnedCodes = useMemo(
    () => new Set(earned.map((e) => e.tier?.code || e.title).filter(Boolean)),
    [earned]
  );

  const wasteSteps = useMemo(
    () => wasteTiers.filter((t) => !earnedCodes.has(t.code || t.title)).map((t) => toNum(t.min_waste_kg)),
    [wasteTiers, earnedCodes]
  );
  const prodSteps = useMemo(
    () => prodTiers.filter((t) => !earnedCodes.has(t.code || t.title)).map((t) => t.min_producers_supported),
    [prodTiers, earnedCodes]
  );

  const wasteProg = progressToNext(wasteValue, wasteSteps);
  const prodProg = progressToNext(producersValue, prodSteps);

  const nextWasteTier = useMemo(
    () => wasteTiers.find((t) => !earnedCodes.has(t.code || t.title) && toNum(t.min_waste_kg) > wasteValue),
    [wasteTiers, earnedCodes, wasteValue]
  );
  const nextProdTier = useMemo(
    () => prodTiers.find((t) => !earnedCodes.has(t.code || t.title) && t.min_producers_supported > producersValue),
    [prodTiers, earnedCodes, producersValue]
  );

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

  if (loading) return <div className="text-gray-600">Chargement…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-dark-green rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-8 h-8 text-pale-yellow" />
          </div>
          <h3 className="text-2xl font-bold text-dark-green mb-2">{wasteValue.toFixed(2)}kg</h3>
          <p className="text-gray-600">Gaspillage évité</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-orange-beige rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-dark-green mb-2">{co2Value.toFixed(2)}kg</h3>
          <p className="text-gray-600">CO₂ économisé</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-medium-brown rounded-full flex items-center justify-center mx-auto mb-4">
            <Euro className="w-8 h-8 text-pale-yellow" />
          </div>
          <h3 className="text-2xl font-bold text-dark-green mb-2">{savingsValue.toFixed(2)}€</h3>
          <p className="text-gray-600">Économies réalisées</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark-green mb-4">Vos récompenses</h3>

        <div className="space-y-4">
          {earned.length === 0 ? (
            <div className="text-gray-500 text-sm">Aucune récompense débloquée pour le moment.</div>
          ) : (
            earned.map((r, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-pale-yellow/30 rounded-lg">
                <Award className="w-6 h-6 text-orange-beige" />
                <div>
                  <p className="font-medium text-dark-green">{r.title}</p>
                  <p className="text-sm text-gray-600">{r.description}</p>
                </div>
              </div>
            ))
          )}

          {nextWasteTier && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Lock className="w-5 h-5 text-gray-400 mt-1" />
              <div className="w-full">
                <p className="font-medium text-gray-600">{nextWasteTier.title}</p>
                <p className="text-sm text-gray-400">{nextWasteTier.description}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-dark-green h-2 rounded-full"
                    style={{ width: `${Math.round(wasteProg.pct * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {nextProdTier && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Lock className="w-5 h-5 text-gray-400 mt-1" />
              <div className="w-full">
                <p className="font-medium text-gray-600">{nextProdTier.title}</p>
                <p className="text-sm text-gray-400">{nextProdTier.description}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-dark-green h-2 rounded-full"
                    style={{ width: `${Math.round(prodProg.pct * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-dark-green" />
          <h3 className="text-lg font-semibold text-dark-green">Recommandés pour vous</h3>
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
                      <h4 className="text-lg font-semibold text-dark-green leading-snug line-clamp-2">
                        {b.title}
                      </h4>
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
                        if (Number(b.stock) <= 0) {
                          toast.error('Ce lot est en rupture de stock.');
                          return;
                        }
                        await addBundleToCart(b);
                        toast.success(`${b.title} ajouté au panier !`);
                      } catch {
                        toast.error("Impossible d'ajouter au panier.");
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
  );
}
