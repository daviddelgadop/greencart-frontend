import React, { useEffect, useMemo, useState } from 'react';
import { TrendingDown, Leaf, Euro, Award, Lock } from 'lucide-react';
import { http } from '../lib/api';

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
    </div>
  );
}
