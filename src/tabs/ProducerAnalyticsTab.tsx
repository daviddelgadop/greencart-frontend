import React, { useEffect, useMemo, useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { http } from '../lib/api';

type SeasonalForecast = {
  product_id: number;
  label: string;
  forecasted_units: number;
  baseline_units: number;
  last_week_units: number;
  forecast_delta_pct: number;
  status: string;
};

type Recommendation = { type: 'suggestion' | 'alert'; message: string };

type Clusters = {
  loyal: { count: number };
  new: { count: number };
  occasional: { count: number };
};

type AnalyticsPayload = {
  seasonal_forecasts: SeasonalForecast[];
  recommendations: Recommendation[];
  clusters: Clusters;
};

type AIPreview = {
  ai_output: Recommendation[];
};

const USE_FORECAST_IA = (import.meta.env.VITE_FORECAST_IA as string) === 'true';

function pctLabel(n: number) {
  const v = Math.round(n);
  return `${v >= 0 ? '+' : ''}${v}%`;
}

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<SeasonalForecast[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [clusters, setClusters] = useState<Clusters | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError(null)
      try {
        if (USE_FORECAST_IA) {
          const [analytics, ai] = await Promise.all([
            http.get<AnalyticsPayload>('/api/producer/analytics/'),
            http.get<AIPreview>('/api/producer/ai-preview/')
          ])
          setForecasts(Array.isArray(analytics?.seasonal_forecasts) ? analytics.seasonal_forecasts : [])
          setClusters(analytics?.clusters ?? null)
          setRecs(Array.isArray(ai?.ai_output) ? ai.ai_output : [])
        } else {
          const analytics = await http.get<AnalyticsPayload>('/api/producer/analytics/')
          setForecasts(Array.isArray(analytics?.seasonal_forecasts) ? analytics.seasonal_forecasts : [])
          setRecs(Array.isArray(analytics?.recommendations) ? analytics.recommendations : [])
          setClusters(analytics?.clusters ?? null)
        }
      } catch {
        setError('Erreur lors du chargement.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])


  const top3 = useMemo(() => forecasts.slice(0, 3), [forecasts]);

  if (loading) return <div className="text-gray-600">Chargement…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark-green"></h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-dark-green mb-4">Prévisions saisonnières</h3>
          <div className="space-y-4">
            {top3.length === 0 ? (
              <div className="text-gray-500 text-sm">Aucune donnée de prévision.</div>
            ) : (
              top3.map((f) => {
                const isUp = f.forecast_delta_pct >= 15;
                const isDown = f.forecast_delta_pct <= -10;
                const bg = isUp ? 'bg-pale-yellow/20' : isDown ? 'bg-red-50' : 'bg-gray-50';
                return (
                  <div key={f.product_id} className={`flex justify-between items-center p-3 rounded-lg ${bg}`}>
                    <div>
                      <p className="font-medium text-dark-green">{f.label}</p>
                      <p className="text-sm text-gray-600">{f.status}</p>
                    </div>
                    <div className={`font-semibold ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-600'}`}>
                      {pctLabel(f.forecast_delta_pct)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-green">Recommandations {USE_FORECAST_IA && 'IA'}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                USE_FORECAST_IA ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {USE_FORECAST_IA ? 'OpenAI activé' : 'OpenAI désactivé'}
            </span>
          </div>
          <div className="space-y-4">
            {recs.length === 0 ? (
              <div className="text-gray-500 text-sm">Aucune recommandation disponible.</div>
            ) : (
              recs.map((r, idx) => {
                const isSuggestion = r.type === 'suggestion';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      isSuggestion ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        isSuggestion ? 'text-blue-800' : 'text-orange-800'
                      } flex items-center gap-2`}
                    >
                      {isSuggestion ? <Info className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {isSuggestion ? 'Suggestion' : 'Alerte'}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        isSuggestion ? 'text-blue-700' : 'text-orange-700'
                      }`}
                    >
                      {r.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark-green mb-4">Clustering clients</h3>
        {clusters ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-dark-green mb-2">Clients fidèles</h4>
              <p className="text-2xl font-bold text-dark-green">{clusters.loyal?.count ?? 0}</p>
              <p className="text-sm text-gray-600">Achètent régulièrement</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-dark-green mb-2">Nouveaux clients</h4>
              <p className="text-2xl font-bold text-dark-green">{clusters.new?.count ?? 0}</p>
              <p className="text-sm text-gray-600">Premier achat récent</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-dark-green mb-2">Clients occasionnels</h4>
              <p className="text-2xl font-bold text-dark-green">{clusters.occasional?.count ?? 0}</p>
              <p className="text-sm text-gray-600">Achats irréguliers</p>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">Aucune donnée de clients.</div>
        )}
      </div>
    </div>
  );
}
