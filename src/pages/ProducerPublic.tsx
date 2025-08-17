import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  Store,
  ArrowRight,
  CalendarDays,
  BadgeCheck,
  Users,
  Star,
  SortAsc,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL as string;

type City = {
  name: string;
  postal_code: string;
  department_data?: { code: string; name: string };
  region_data?: { code: string; name: string };
};
type Address = {
  street_number?: string | null;
  street_name?: string | null;
  city?: City | null;
};
type Certification = { code: string; label?: string };
type Company = {
  id: number;
  name: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: Address | null;
  siret?: string | null;
  siret_number?: string | null;
  certifications?: Array<string | Certification>;
  avg_rating?: string | number | null;
  ratings_count?: number | null;
};
type Producer = {
  id: number;
  public_display_name?: string | null;
  years_of_experience?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  description?: string | null;
  description_utilisateur?: string | null;
  joined_at?: string | null;
  avg_rating?: string | number | null;
  ratings_count?: number | null;
};
type BundleEvaluation = {
  order_id: number;
  order_code?: string;
  ordered_at?: string | null;
  user_display_name?: string | null;
  rating?: number | null;
  note?: string | null;
  rated_at?: string | null;
  quantity?: number | null;
  order_status?: string | null;
  line_total?: string | null;
  bundle_id?: number;
  bundle_title?: string;
};
type ProductImage = { id: number; image: string };
type Bundle = {
  id: number;
  title: string;
  discounted_price: string;
  original_price: string;
  discounted_percentage?: number | null;
  stock?: number | null;
  created_at?: string | null;
  producer_data?: { id: number };
  avg_rating?: string | number | null;
  ratings_count?: number | null;
  items?: Array<{ product?: { images?: ProductImage[] } }>;
  evaluations?: BundleEvaluation[];
  last_rated_at?: string | null;
};

function StarsDisplay({ value = 0, size = 16 }: { value?: number; size?: number }) {
  const clamped = Math.max(0, Math.min(5, Number(value) || 0));
  const widthPct = (clamped / 5) * 100;
  const starStyle: React.CSSProperties = { width: size, height: size };
  return (
    <span className="relative inline-block align-middle" style={{ lineHeight: 0 }}>
      <span className="flex text-gray-300 select-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={`o-${i}`} style={starStyle} className="shrink-0" />
        ))}
      </span>
      <span
        className="pointer-events-none absolute top-0 left-0 overflow-hidden text-yellow-500"
        style={{ width: `${widthPct}%` }}
        aria-hidden="true"
      >
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={`f-${i}`} style={starStyle} className="shrink-0" fill="currentColor" />
          ))}
        </span>
      </span>
    </span>
  );
}

function producerName(p: Producer) {
  const disp = (p.public_display_name || "").trim();
  if (disp) return disp;
  return `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Producteur";
}

function normalizeCerts(arr: Array<string | Certification> | undefined): Certification[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((c) => (typeof c === "string" ? { code: c, label: c } : c));
}

function formatCityName(raw?: string | null) {
  if (!raw) return "";
  const s = String(raw).toLowerCase().replace(/\s+/g, " ").trim();
  const keepLower = new Set(["de", "du", "des", "la", "le", "les", "en", "sur", "sous", "aux", "au", "et"]);
  return s
    .split(" ")
    .map((word, idx) => {
      if (/^[a-z]’/.test(word) || /^[a-z]'/.test(word)) {
        return word[0].toUpperCase() + word.slice(1);
      }
      if (keepLower.has(word) && idx !== 0) return word;
      return word
        .split("-")
        .map((seg) => (seg ? seg[0].toUpperCase() + seg.slice(1) : seg))
        .join("-");
    })
    .join(" ");
}

function formatAddressLinesFR(addr?: Address | null): [string, string] {
  if (!addr) return ["", "France"];
  const street = [addr.street_number, addr.street_name].filter(Boolean).join(" ").trim();
  const postal = addr.city?.postal_code || "";
  const city = formatCityName(addr.city?.name || "");
  const line2Core = [postal, city].filter(Boolean).join(" ").trim();
  const line2 = line2Core ? `${line2Core}, France` : "France";
  return [street, line2];
}

function formatDate(d: Date) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
function formatDateTimeISO(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${mm}`;
}

type EvalSort = "rated_desc" | "rated_asc" | "rating_desc" | "rating_asc";

export default function ProducerPublic() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [featured, setFeatured] = useState<Bundle[]>([]);
  const [recentlyRated, setRecentlyRated] = useState<Bundle[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [evalSort, setEvalSort] = useState<EvalSort>("rated_desc");
  const [evalPage, setEvalPage] = useState(1);
  const EVALS_PER_PAGE = 10;

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) {
        setError("Identifiant du producteur manquant.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/public/producers/${id}/`);
        if (!res.ok) throw new Error("Load error");
        const data = await res.json();
        if (!alive) return;

        setProducer((data?.producer as Producer) || null);
        setCompanies((Array.isArray(data?.companies) ? data.companies : []) as Company[]);
        setFeatured((Array.isArray(data?.featured_bundles) ? data.featured_bundles : []) as Bundle[]);
        setRecentlyRated(
          (Array.isArray(data?.recently_rated_bundles) ? data.recently_rated_bundles : []) as Bundle[]
        );
      } catch {
        setError("Impossible de charger ce producteur.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const name = useMemo(() => (producer ? producerName(producer) : ""), [producer]);
  const exp = useMemo(() => {
    if (!producer || typeof producer.years_of_experience !== "number" || producer.years_of_experience <= 0)
      return "Producteur local engagé";
    return `${producer.years_of_experience} ${producer.years_of_experience === 1 ? "an" : "ans"} d’expérience`;
  }, [producer]);

  const producerAvg = useMemo(() => Number(producer?.avg_rating), [producer]);
  const producerCount = useMemo(() => Number(producer?.ratings_count ?? 0), [producer]);
  const hasProducerRating = Number.isFinite(producerAvg) && producerCount > 0;

  const recentTop3 = useMemo(() => {
    const arr = [...recentlyRated];
    arr.sort((a, b) => {
      const A = new Date(a.last_rated_at || a.created_at || 0).getTime();
      const B = new Date(b.last_rated_at || b.created_at || 0).getTime();
      return B - A;
    });
    return arr.slice(0, 3);
  }, [recentlyRated]);

  const bestTop3 = useMemo(() => {
    const arr = [...recentlyRated];
    arr.sort((a, b) => {
      const ra = Number(a.avg_rating) || 0;
      const rb = Number(b.avg_rating) || 0;
      if (rb !== ra) return rb - ra;
      const ca = Number(a.ratings_count) || 0;
      const cb = Number(b.ratings_count) || 0;
      if (cb !== ca) return cb - ca;
      const A = new Date(a.last_rated_at || a.created_at || 0).getTime();
      const B = new Date(b.last_rated_at || b.created_at || 0).getTime();
      return B - A;
    });
    return arr.slice(0, 3);
  }, [recentlyRated]);

  const allEvaluations = useMemo(() => {
    const bundles: Bundle[] = [...featured, ...recentlyRated];
    const dedup = new Map<string, BundleEvaluation>();
    for (const b of bundles) {
      if (!Array.isArray(b.evaluations)) continue;
      for (const ev of b.evaluations) {
        const key = `${ev.order_id}|${ev.bundle_id || b.id}|${ev.rated_at || ev.ordered_at || ""}`;
        if (!dedup.has(key)) {
          dedup.set(key, {
            ...ev,
            bundle_id: ev.bundle_id || b.id,
            bundle_title: ev.bundle_title || b.title,
          });
        }
      }
    }
    const list = Array.from(dedup.values());
    const sorted = [...list].sort((a, b) => {
      const rateA = Number(a.rating) || 0;
      const rateB = Number(b.rating) || 0;
      const timeA = new Date(a.rated_at || a.ordered_at || 0).getTime();
      const timeB = new Date(b.rated_at || b.ordered_at || 0).getTime();
      switch (evalSort) {
        case "rating_desc":
          return rateB - rateA || timeB - timeA;
        case "rating_asc":
          return rateA - rateB || timeB - timeA;
        case "rated_asc":
          return timeA - timeB || rateB - rateA;
        case "rated_desc":
        default:
          return timeB - timeA || rateB - rateA;
      }
    });
    return sorted;
  }, [featured, recentlyRated, evalSort]);

  const totalPages = Math.max(1, Math.ceil(allEvaluations.length / EVALS_PER_PAGE));
  const page = Math.min(evalPage, totalPages);
  const pageSlice = allEvaluations.slice((page - 1) * EVALS_PER_PAGE, page * EVALS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-black/5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100" />
              <div className="h-6 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="mt-6 h-4 bg-gray-100 rounded w-2/3" />
            <div className="mt-2 h-4 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-red-200 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-black/5">
            Producteur introuvable.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                {producer.avatar ? (
                  <img
                    src={producer.avatar}
                    alt={name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-dark-green/10 flex items-center justify-center text-dark-green font-bold text-3xl">
                    {name.slice(0, 1)}
                  </div>
                )}

                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-3">
                    <Users className="w-8 h-8" />
                    {name}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-dark-green/10 text-dark-green px-3 py-1 font-medium">
                      {exp}
                    </span>
                    <span className="inline-flex items-center gap-2 text-gray-600">
                      <CalendarDays className="w-4 h-4" />
                      {producer.joined_at
                        ? `Membre depuis ${new Date(producer.joined_at).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                          })}`
                        : "Producteur vérifié de notre communauté"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {hasProducerRating ? (
                      <>
                        <StarsDisplay value={producerAvg} />
                        <span className="text-gray-700 text-sm font-medium">
                          {producerAvg.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">({producerCount})</span>
                      </>
                    ) : (
                      <>
                        <StarsDisplay value={0} />
                        <span className="text-xs text-gray-500">Non noté (0)</span>
                      </>
                    )}
                  </div>

                  <p className="mt-4 text-gray-700 leading-relaxed">
                    {producer.description_utilisateur?.trim() ||
                      producer.bio?.trim() ||
                      producer.description?.trim() ||
                      "Découvrez les produits de ce producteur et soutenez une production locale et responsable."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/shop?producer=${encodeURIComponent(name)}&sortField=created_at&order=desc`}
                      className="inline-flex items-center gap-2 bg-dark-green text-pale-yellow px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-dark-green/90 shadow-sm"
                    >
                      Voir les offres de ce producteur <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/producers"
                      className="inline-flex items-center gap-2 border border-dark-green text-dark-green px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-dark-green hover:text-white"
                    >
                      Voir tous les producteurs <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold text-dark-green flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Commerces
            </h2>
          </div>

          {companies.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-gray-600 shadow-sm ring-1 ring-black/5">
              Aucun commerce
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((c) => {
                const [addrL1, addrL2] = formatAddressLinesFR(c.address);
                const certs = normalizeCerts(c.certifications);
                const siret = c.siret_number || c.siret || null;
                const avg = Number(c.avg_rating);
                const cnt = Number(c.ratings_count || 0);
                const has = Number.isFinite(avg) && cnt > 0;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {c.logo ? (
                        <img
                          src={c.logo}
                          alt={c.name}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-dark-green/10 flex items-center justify-center flex-shrink-0">
                          <Store className="w-10 h-10 text-dark-green" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-dark-green leading-snug">{c.name}</h3>

                        <div className="mt-1 flex items-center gap-2">
                          {has ? (
                            <>
                              <StarsDisplay value={avg} />
                              <span className="text-sm text-gray-700 font-medium">
                                {avg.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500">({cnt})</span>
                            </>
                          ) : (
                            <>
                              <StarsDisplay value={0} />
                              <span className="text-xs text-gray-500">Non noté (0)</span>
                            </>
                          )}
                        </div>

                        {(addrL1 || addrL2) && (
                          <div className="mt-1.5 flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                            <div className="leading-snug">
                              {addrL1 && <div>{addrL1}</div>}
                              <div>{addrL2}</div>
                            </div>
                          </div>
                        )}

                        {siret && (
                          <div className="mt-1 text-sm text-gray-600">
                            SIRET <span className="font-medium">{siret}</span>
                          </div>
                        )}

                        {c.description && (
                          <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                            {c.description}
                          </p>
                        )}

                        {certs.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {certs.map((cert, idx) => (
                              <span
                                key={`${cert.code}-${idx}`}
                                className="inline-flex items-center gap-1 rounded-full bg-dark-green text-pale-yellow px-2.5 py-1 text-xs font-medium shadow-sm"
                              >
                                <BadgeCheck className="w-3 h-3" />
                                {cert.label || cert.code}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-5">
                          <Link
                            to={`/shop?commerce=${encodeURIComponent(c.name)}&sortField=created_at&order=desc`}
                            className="inline-flex items-center gap-2 rounded-full border border-dark-green text-dark-green px-4 py-2 text-sm font-semibold hover:bg-dark-green hover:text-white"
                          >
                            Voir les offres de ce commerce <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-dark-green mb-5">Produits récemment évalués</h2>
          {recentTop3.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-gray-600 shadow-sm ring-1 ring-black/5">
              Aucun produit évalué récemment
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentTop3.map((b) => {
                const img = b.items?.[0]?.product?.images?.[0]?.image;
                const avg = Number(b.avg_rating);
                const cnt = Number(b.ratings_count || 0);
                const has = Number.isFinite(avg) && cnt > 0;
                return (
                  <Link
                    key={b.id}
                    to={`/bundle/${b.id}`}
                    className="group bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow"
                  >
                    {img && (
                      <img
                        src={img}
                        alt={b.title}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-dark-green mb-2 line-clamp-2 group-hover:text-medium-brown">
                      {b.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      {has ? (
                        <>
                          <StarsDisplay value={avg} />
                          <span className="text-sm text-gray-700 font-medium">
                            {avg.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">({cnt})</span>
                        </>
                      ) : (
                        <>
                          <StarsDisplay value={0} />
                          <span className="text-xs text-gray-500">Non noté (0)</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-dark-green">
                        {Number(b.discounted_price).toFixed(2)}€
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {Number(b.original_price).toFixed(2)}€
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>



        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-dark-green mb-5">Meilleurs produits évalués</h2>
          {bestTop3.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-gray-600 shadow-sm ring-1 ring-black/5">
              Aucun produit évalué
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bestTop3.map((b) => {
                const img = b.items?.[0]?.product?.images?.[0]?.image;
                const avg = Number(b.avg_rating);
                const cnt = Number(b.ratings_count || 0);
                const has = Number.isFinite(avg) && cnt > 0;
                return (
                  <Link
                    key={b.id}
                    to={`/bundle/${b.id}`}
                    className="group bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow"
                  >
                    {img && (
                      <img
                        src={img}
                        alt={b.title}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-dark-green mb-2 line-clamp-2 group-hover:text-medium-brown">
                      {b.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      {has ? (
                        <>
                          <StarsDisplay value={avg} />
                          <span className="text-sm text-gray-700 font-medium">
                            {avg.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">({cnt})</span>
                        </>
                      ) : (
                        <>
                          <StarsDisplay value={0} />
                          <span className="text-xs text-gray-500">Non noté (0)</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-dark-green">
                        {Number(b.discounted_price).toFixed(2)}€
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {Number(b.original_price).toFixed(2)}€
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>


        <section>
          <h2 className="text-2xl font-semibold text-dark-green mb-5">Produits récents en promotion</h2>
          {featured.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-gray-600 shadow-sm ring-1 ring-black/5">
              Aucun produit en promotion
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.slice(0, 3).map((b) => {
                const img = b.items?.[0]?.product?.images?.[0]?.image;
                const avg = Number(b.avg_rating);
                const cnt = Number(b.ratings_count || 0);
                const has = Number.isFinite(avg) && cnt > 0;

                return (
                  <Link
                    key={b.id}
                    to={`/bundle/${b.id}`}
                    className="group bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow"
                  >
                    {img && (
                      <img
                        src={img}
                        alt={b.title}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-dark-green mb-2 line-clamp-2 group-hover:text-medium-brown">
                      {b.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      {has ? (
                        <>
                          <StarsDisplay value={avg} />
                          <span className="text-sm text-gray-700 font-medium">
                            {avg.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">({cnt})</span>
                        </>
                      ) : (
                        <>
                          <StarsDisplay value={0} />
                          <span className="text-xs text-gray-500">Non noté (0)</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-dark-green">
                        {Number(b.discounted_price).toFixed(2)}€
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {Number(b.original_price).toFixed(2)}€
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="h-8" />

        <section className="mb-10">
          <div className="bg-[#fffdf8] rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-dark-green">Avis</h2>
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-gray-500" />
                <select
                  value={evalSort}
                  onChange={(e) => {
                    setEvalSort(e.target.value as EvalSort);
                    setEvalPage(1);
                  }}
                  className="border rounded px-2 py-1 bg-white text-sm"
                  aria-label="Trier les avis"
                >
                  <option value="rated_desc">Date d’avis (récent → ancien)</option>
                  <option value="rated_asc">Date d’avis (ancien → récent)</option>
                  <option value="rating_desc">Note (haute → basse)</option>
                  <option value="rating_asc">Note (basse → haute)</option>
                </select>
              </div>
            </div>

            {pageSlice.length === 0 ? (
              <div className="text-gray-500">Aucun avis pour l’instant.</div>
            ) : (
              <ul className="space-y-4">
                {pageSlice.map((ev, idx) => (
                  <li
                    key={`${ev.order_id}-${ev.bundle_id}-${ev.rated_at}-${idx}`}
                    className="rounded-xl border bg-white p-4"
                  >
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <StarsDisplay value={Number(ev.rating || 0)} />
                        <span className="text-sm text-gray-700 font-medium">
                          {Math.round(Number(ev.rating) || 0)}/5
                        </span>
                      </div>
                      <div>Produit : {ev.bundle_id && (
                        <Link
                          to={`/bundle/${ev.bundle_id}`}
                          className="font-medium text-dark-green hover:underline"
                        >
                          {ev.bundle_title || `Bundle #${ev.bundle_id}`}
                        </Link>
                      )}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{ev.user_display_name || "Client"}</span>
                        {" · "}
                        <span>
                          Commande : <span className="font-mono">{ev.order_code}</span>
                        </span>
                      </div>
                      <div>
                        Date de commande :{" "}
                        <span className="text-gray-700">{formatDateTimeISO(ev.ordered_at)}</span>
                      </div>
                      <div>
                        Date d’avis :{" "}
                        <span className="text-gray-700">{formatDateTimeISO(ev.rated_at)}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-gray-700">
                      {ev.note && ev.note.trim().length > 0 ? ev.note : "Aucun commentaire"}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setEvalPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`px-3 py-1 rounded border ${
                    page <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setEvalPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`px-3 py-1 rounded border ${
                    page >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </section>


      </div>
    </div>
  );
}
